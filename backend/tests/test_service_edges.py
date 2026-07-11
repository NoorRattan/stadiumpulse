from datetime import UTC, datetime, timedelta

import pytest
from conftest import FakeDb

import services.crowd_service as crowd_service
from models.route import AccessibilityNeed, CongestionLevel
from models.zone import Zone, ZoneType
from services.briefing_service import summarize_incidents
from services.concierge_service import handle_chat_message, normalize_language
from services.exceptions import AIServiceError, ResourceNotFoundError
from services.incident_service import draft_incident
from services.travel_service import (
    get_fresh_cache,
    get_travel_suggestions,
    rank_by_load,
    static_transit_options_for_venue,
)
from services.wayfinding_service import (
    GraphEdge,
    PathResult,
    congestion_level_for_path,
    dijkstra_shortest_path,
    find_comparable_alternatives,
    format_route_as_static_steps,
    get_route,
)


def zone(zone_id: str, density: float, zone_type: ZoneType = ZoneType.gate, lat: float = 0.0) -> Zone:
    return Zone(
        zoneId=zone_id,
        name=zone_id,
        type=zone_type,
        capacity=100,
        currentDensityPct=density,
        lastUpdated=datetime(2026, 1, 1, tzinfo=UTC),
        coordinates={"lat": lat, "lng": 0.0},
    )


def test_fake_db_helper_edges(mock_db: FakeDb) -> None:
    doc = mock_db.collection("missing").document("nope")
    with pytest.raises(KeyError):
        doc.update({"x": 1})
    assert mock_db.collection("zones").stream()[0].id == "gate-2"


def test_crowd_alert_bands_and_critical_auto_flag(mock_db: FakeDb) -> None:
    normal = zone("normal", 20)
    moderate = zone("moderate", 60)
    high = zone("high", 80)
    critical = zone("critical", 95)
    overflow = zone("overflow", 10, lat=1.0)
    zones = [normal, moderate, high, critical, overflow]

    assert crowd_service.congestion_band(60) == "MODERATE"
    assert crowd_service.congestion_multiplier(50) == 1.75
    assert crowd_service.action_for_band("NORMAL") is None
    assert crowd_service.build_alert(normal, zones, db=mock_db) is None
    assert crowd_service.build_alert(moderate, zones, db=mock_db).action_type == "MONITOR"
    assert crowd_service.build_alert(high, zones, db=mock_db).overflow_zone_id == "normal"

    alert = crowd_service.build_alert(critical, zones, db=mock_db)

    assert alert.action_type == "URGENT_REROUTE"


@pytest.mark.asyncio
async def test_crowd_load_zones_skips_empty_snapshots_and_filter(
    monkeypatch: pytest.MonkeyPatch, mock_db: FakeDb
) -> None:
    mock_db.store["zones"]["empty"] = {}
    mock_db.store["zones"]["gate-4"]["currentDensityPct"] = 95.0
    alerts = await crowd_service.list_zone_alerts(ZoneType.gate, db=mock_db)

    assert all(alert.zone_id in {"gate-4"} for alert in alerts)
    assert len(mock_db.store["incidents"]) == 2

    assert (await crowd_service.auto_flag_incident(zone("critical", 99), 99, db=mock_db)).severity.value == "critical"


@pytest.mark.asyncio
async def test_concierge_language_fallback_existing_session_and_no_data(mock_db: FakeDb) -> None:
    assert normalize_language(" FR ") == ("fr", False)
    assert normalize_language("xx") == ("en", True)

    mock_db.store["conciergeSessions"] = {
        "existing": {"userId": "fan-1", "language": "en", "startedAt": datetime.now(tz=UTC)}
    }
    mock_db.store["conciergeSessions/existing/messages"] = {"empty": {}}

    response = await handle_chat_message("fan-1", "bonjour", "xx", session_id="existing", db=mock_db)

    assert response.session_id == "existing"
    assert response.reply.startswith("Language fallback:")


@pytest.mark.asyncio
async def test_incident_service_rejects_invalid_ai_severity(mock_db: FakeDb, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "services.incident_service.incidentTriageFlow",
        lambda zone_id, zone_name, raw_input: {"summary": "bad", "severity": "unsupported"},
    )

    with pytest.raises(AIServiceError, match="unsupported severity"):
        await draft_incident("gate-4", "issue", "staff-1", db=mock_db)


@pytest.mark.asyncio
async def test_travel_cache_and_invalid_match_shapes(mock_db: FakeDb) -> None:
    now = datetime.now(tz=UTC)
    mock_db.store["travelSuggestionsCache"]["cached"] = {
        "expireAt": now + timedelta(minutes=5),
        "suggestions": [{"mode": "rail", "description": "Use rail."}],
    }
    assert await get_fresh_cache(mock_db, "missing") is None
    assert (await get_fresh_cache(mock_db, "cached"))[0].mode == "rail"

    mock_db.store["travelSuggestionsCache"]["expired"] = {
        "expireAt": now - timedelta(minutes=5),
        "suggestions": [{"mode": "rail", "description": "Use rail."}],
    }
    mock_db.store["travelSuggestionsCache"]["bad"] = {
        "expireAt": now + timedelta(minutes=5),
        "suggestions": "rail",
    }
    mock_db.store["travelSuggestionsCache"]["wrong-type"] = {
        "expireAt": now + timedelta(minutes=5),
        "suggestions": 42,
    }
    assert await get_fresh_cache(mock_db, "expired") is None
    assert await get_fresh_cache(mock_db, "bad") is None
    assert await get_fresh_cache(mock_db, "wrong-type") is None

    mock_db.store["matches"]["bad-load"] = {
        "venueZoneIds": [],
        "transitLoadEstimate": "packed",
    }
    mock_db.store["matches"]["bad-zones"] = {
        "venueZoneIds": [3],
        "transitLoadEstimate": "low",
    }
    with pytest.raises(ValueError, match="Unsupported transitLoadEstimate"):
        await get_travel_suggestions("bad-load", db=mock_db)
    with pytest.raises(ValueError, match="invalid venueZoneIds"):
        await get_travel_suggestions("bad-zones", db=mock_db)


@pytest.mark.asyncio
async def test_travel_ranking_and_missing_match(mock_db: FakeDb) -> None:
    assert [option.mode for option in static_transit_options_for_venue([])] == ["rail", "rideshare-pool"]
    ranked = rank_by_load(static_transit_options_for_venue(["gate-2"]), "low")
    assert ranked[0].mode in {"rideshare-pool", "walk"}
    with pytest.raises(ResourceNotFoundError):
        await get_travel_suggestions("missing", db=mock_db)


def test_wayfinding_alternatives_static_steps_and_missing_route(mock_db: FakeDb) -> None:
    zones = {
        "a": zone("a", 10),
        "b": zone("b", 60),
        "c": zone("c", 80),
        "d": zone("d", 40),
        "e": zone("e", 91),
    }
    graph = {
        "a": [GraphEdge("b", 1.0), GraphEdge("c", 1.05)],
        "b": [GraphEdge("d", 1.0)],
        "c": [GraphEdge("d", 1.0)],
        "d": [],
    }
    baseline = dijkstra_shortest_path(graph, "a", "d", zones)
    alternatives = find_comparable_alternatives(graph, baseline, "a", "d", zones)
    static = format_route_as_static_steps(PathResult(["a", "c"], 2.2), zones)

    assert alternatives[0].zones == ["a", "c", "d"]
    assert congestion_level_for_path([], zones) == CongestionLevel.low
    assert congestion_level_for_path(["b"], zones) == CongestionLevel.medium
    assert congestion_level_for_path(["c"], zones) == CongestionLevel.high
    assert congestion_level_for_path(["e"], zones) == CongestionLevel.critical
    assert static.estimated_minutes == 3
    with pytest.raises(ResourceNotFoundError):
        dijkstra_shortest_path({"a": []}, "a", "d", zones)
    with pytest.raises(ResourceNotFoundError):
        dijkstra_shortest_path(
            {"a": [GraphEdge("b", 10.0), GraphEdge("c", 1.0)], "b": [], "c": [GraphEdge("b", 1.0)]},
            "a",
            "z",
            zones,
        )

    pruned_to_no_route = find_comparable_alternatives(
        {"a": [GraphEdge("b", 1.0)], "b": []},
        PathResult(["a", "b"], 1.0),
        "a",
        "b",
        zones,
    )
    assert pruned_to_no_route == []


def test_briefing_summary_handles_no_incidents() -> None:
    assert summarize_incidents([]) == "None reported"


@pytest.mark.asyncio
async def test_wayfinding_value_error_returns_fallback(monkeypatch: pytest.MonkeyPatch, mock_db: FakeDb) -> None:
    def raise_value_error(*args: object, **kwargs: object) -> None:
        raise ValueError("bad")

    monkeypatch.setattr(
        "services.wayfinding_service.wayfindingFlow",
        raise_value_error,
    )

    response = await get_route("gate-2", "seat-block-114", [AccessibilityNeed.wheelchair], db=mock_db)

    assert response.generated_by == "fallback"
