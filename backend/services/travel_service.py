from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

from google.cloud import firestore

from schemas.responses import TravelSuggestion, TravelSuggestionsResponse
from services.exceptions import ResourceNotFoundError
from services.firestore_client import get_firestore_client
from services.genkit_flows import describe_travel_options

TransitLoad = Literal["low", "medium", "high"]


@dataclass(frozen=True)
class TransitOption:
    mode: str
    base_priority: int
    load_fit: tuple[TransitLoad, ...]
    note: str


STATIC_TRANSIT_OPTIONS: tuple[TransitOption, ...] = (
    TransitOption("rail", 1, ("medium", "high"), "Best for heavy arrival waves and predictable post-match exits."),
    TransitOption(
        "rideshare-pool",
        2,
        ("low", "medium"),
        "Use the signed shared pickup zone after peak pedestrian flow.",
    ),
    TransitOption("stadium-shuttle", 3, ("high",), "Moves fans from outer transit hubs to gate approaches."),
    TransitOption("walk", 4, ("low",), "Good for nearby hotels and low-load arrival windows."),
)


def load_match(db: firestore.Client, match_id: str) -> dict[str, Any]:
    snapshot = db.collection("matches").document(match_id).get()
    data = snapshot.to_dict() if snapshot.exists else None
    if not data:
        raise ResourceNotFoundError(f"Match not found: {match_id}")
    return {"matchId": snapshot.id, **data}


def get_fresh_cache(db: firestore.Client, match_id: str) -> list[TravelSuggestion] | None:
    snapshot = db.collection("travelSuggestionsCache").document(match_id).get()
    data = snapshot.to_dict() if snapshot.exists else None
    if not data:
        return None

    expire_at = data.get("expireAt")
    suggestions = data.get("suggestions")
    if not isinstance(expire_at, datetime) or expire_at <= datetime.now(tz=UTC):
        return None
    if not isinstance(suggestions, list):
        return None
    return [TravelSuggestion.model_validate(item) for item in suggestions]


def static_transit_options_for_venue(venue_zone_ids: list[str]) -> list[TransitOption]:
    if not venue_zone_ids:
        return list(STATIC_TRANSIT_OPTIONS[:2])
    return list(STATIC_TRANSIT_OPTIONS)


def rank_by_load(options: list[TransitOption], transit_load_estimate: TransitLoad) -> list[TransitOption]:
    return sorted(
        options,
        key=lambda option: (
            0 if transit_load_estimate in option.load_fit else 1,
            option.base_priority,
        ),
    )


def cache_suggestions(db: firestore.Client, match_id: str, suggestions: list[TravelSuggestion]) -> None:
    generated_at = datetime.now(tz=UTC)
    db.collection("travelSuggestionsCache").document(match_id).set(
        {
            "generatedAt": generated_at,
            "suggestions": [suggestion.model_dump(by_alias=True) for suggestion in suggestions],
            "expireAt": generated_at + timedelta(hours=1),
        }
    )


def get_travel_suggestions(
    match_id: str,
    db: firestore.Client | None = None,
) -> TravelSuggestionsResponse:
    firestore_client = db or get_firestore_client()
    cached = get_fresh_cache(firestore_client, match_id)
    if cached is not None:
        return TravelSuggestionsResponse(matchId=match_id, suggestions=cached)

    match = load_match(firestore_client, match_id)
    load_estimate = match.get("transitLoadEstimate")
    if load_estimate not in {"low", "medium", "high"}:
        raise ValueError(f"Unsupported transitLoadEstimate for match {match_id}.")

    venue_zone_ids = match.get("venueZoneIds")
    if not isinstance(venue_zone_ids, list) or not all(isinstance(item, str) for item in venue_zone_ids):
        raise ValueError(f"Match {match_id} has invalid venueZoneIds.")

    top_options = rank_by_load(static_transit_options_for_venue(venue_zone_ids), load_estimate)[:3]
    descriptions = describe_travel_options(
        [{"mode": option.mode, "note": option.note} for option in top_options],
        load_estimate,
    )
    suggestions = [
        TravelSuggestion(mode=option.mode, description=description)
        for option, description in zip(top_options, descriptions, strict=False)
    ]
    cache_suggestions(firestore_client, match_id, suggestions)
    return TravelSuggestionsResponse(matchId=match_id, suggestions=suggestions)
