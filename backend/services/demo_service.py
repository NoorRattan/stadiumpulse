from datetime import UTC, datetime

import asyncpg

from schemas.responses import (
    CrowdZoneSummary,
    DemoCapability,
    DemoConciergeExample,
    DemoExperienceResponse,
    DemoMatchResponse,
    OperationalDigestItem,
    OperationalDigestResponse,
    TravelSuggestion,
)
from services.crowd_service import (
    build_operational_risks,
    congestion_band,
    load_recent_density_readings,
    load_zones,
)
from services.exceptions import ResourceNotFoundError
from services.wayfinding_service import (
    dijkstra_shortest_path,
    format_route_as_static_steps,
    load_zone_graph,
    remove_edges_tagged,
)


def demo_alert(name: str, density_pct: float) -> str:
    band = congestion_band(density_pct)
    if band == "CRITICAL":
        return f"{name} needs urgent supervised rerouting preparation."
    if band == "HIGH":
        return f"Position staff near {name} and prepare an overflow route."
    if band == "MODERATE":
        return f"Monitor {name} and verify the next simulated reading."
    return f"{name} is operating within the normal demo range."


async def build_demo_experience(db: asyncpg.Pool) -> DemoExperienceResponse:
    """Build a read-only, no-quota demo from the connected seeded database."""
    zones = await load_zones(db)
    zones_by_id = {zone.zone_id: zone for zone in zones}
    if "gate-2" not in zones_by_id or "seat-block-114" not in zones_by_id:
        raise ResourceNotFoundError("The FIFA 2026 demo seed has not been applied.")

    match_row = await db.fetchrow(
        """
        select id, kickoff_at, home_team, away_team, transit_load_estimate
        from public.matches
        where id = $1
        """,
        "m_2026_014",
    )
    if match_row is None:
        raise ResourceNotFoundError("The FIFA 2026 demo match has not been seeded.")

    graph = remove_edges_tagged(load_zone_graph(), "stairs_only")
    path = dijkstra_shortest_path(graph, "gate-2", "seat-block-114", zones_by_id)
    accessible_route = format_route_as_static_steps(path, zones_by_id)

    readings_by_zone = {zone.zone_id: await load_recent_density_readings(db, zone.zone_id) for zone in zones}
    risks = build_operational_risks(zones, readings_by_zone)
    generated_at = datetime.now(tz=UTC).isoformat()
    digest_items = [
        OperationalDigestItem(
            zoneId=risk.zone.zone_id,
            zoneName=risk.zone.name,
            currentDensityPct=risk.zone.current_density_pct,
            projectedDensityPct=risk.forecast.projected_density_pct,
            projectedBand=risk.forecast.projected_band.lower(),
            direction=risk.forecast.direction,
            confidence=risk.forecast.confidence,
            priority=risk.priority,
            recommendedAction=risk.recommended_action,
            requiresSupervisorApproval=True,
        )
        for risk in risks
    ]

    return DemoExperienceResponse(
        scenarioId="fifa-2026-matchday",
        title="United States vs. Canada match-day command scenario",
        tournament="FIFA World Cup 2026",
        generatedAt=generated_at,
        dataStatus="simulated",
        databaseStatus="connected",
        outputSource="curated-demo-preview",
        match=DemoMatchResponse(
            matchId=str(match_row["id"]),
            homeTeam=str(match_row["home_team"]),
            awayTeam=str(match_row["away_team"]),
            kickoffAt=match_row["kickoff_at"].isoformat(),
            transitLoadEstimate=match_row["transit_load_estimate"],
        ),
        zones=[
            CrowdZoneSummary(
                zoneId=zone.zone_id,
                name=zone.name,
                currentDensityPct=zone.current_density_pct,
                band=congestion_band(zone.current_density_pct).lower(),
                alert=demo_alert(zone.name, zone.current_density_pct),
                lastUpdated=zone.last_updated.isoformat(),
            )
            for zone in zones
        ],
        accessibleRoute=accessible_route,
        conciergeExamples=[
            DemoConciergeExample(
                language="English",
                question="What is the step-free route to Section 114?",
                answer="Enter at Gate 2, continue through North Concourse, and follow the lift signs to Section 114.",
            ),
            DemoConciergeExample(
                language="Español",
                question="¿Dónde está la entrada accesible?",
                answer="La entrada accesible está en la Puerta 2. El personal con uniforme puede ayudarle.",
            ),
            DemoConciergeExample(
                language="हिन्दी",
                question="कम भीड़ वाला रास्ता कौन सा है?",
                answer="गेट 2 से नॉर्थ कॉनकोर्स वाला रास्ता लें और लाइव संकेतों का पालन करें।",
            ),
        ],
        travelSuggestions=[
            TravelSuggestion(
                mode="rail",
                description="Use high-capacity rail for the heavy arrival wave and follow timed station guidance.",
            ),
            TravelSuggestion(
                mode="stadium-shuttle",
                description="Board the outer-hub shuttle to reduce private vehicle traffic near stadium gates.",
            ),
            TravelSuggestion(
                mode="rideshare-pool",
                description="Use the signed pooled pickup zone after peak pedestrian flow.",
            ),
        ],
        operationsDigest=OperationalDigestResponse(
            generatedAt=generated_at,
            minutesAhead=15,
            headline=(
                f"{len(risks)} simulated zone{'s' if len(risks) != 1 else ''} need attention"
                if risks
                else "No elevated zones projected"
            ),
            narrative=(
                "The deterministic risk engine ranks crowd pressure first; the authenticated Gemini flow "
                "turns those fixed facts into concise staff guidance. Supervisors approve every action."
            ),
            dataStatus="simulated",
            items=digest_items,
        ),
        capabilities=[
            DemoCapability(
                label="Multilingual GenAI concierge",
                description="Gemini answers practical stadium questions in ten supported languages.",
                liveEndpoint="POST /api/concierge/chat",
            ),
            DemoCapability(
                label="Accessible crowd-aware routing",
                description="A deterministic safe path is rephrased into accessible, fan-friendly instructions.",
                liveEndpoint="POST /api/wayfinding/route",
            ),
            DemoCapability(
                label="Operational decision support",
                description="Forecasts and ranked actions are summarized for staff without automatic execution.",
                liveEndpoint="GET /api/crowd/digest",
            ),
            DemoCapability(
                label="Sustainable transport guidance",
                description="Match load and venue access shape lower-congestion transport suggestions.",
                liveEndpoint="GET /api/travel/suggestions",
            ),
        ],
    )
