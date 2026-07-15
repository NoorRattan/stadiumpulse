import json
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import asyncpg

from schemas.responses import TravelSuggestion, TravelSuggestionsResponse
from services.db import get_pool
from services.exceptions import AIServiceError, ResourceNotFoundError
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
        "park-and-ride",
        2,
        ("low", "medium", "high"),
        (
            "Use the signed outer parking hub and transfer to the accessible stadium shuttle; "
            "venue curb parking is limited."
        ),
    ),
    TransitOption(
        "rideshare-pool",
        3,
        ("low", "medium"),
        "Use the signed shared pickup zone after peak pedestrian flow.",
    ),
    TransitOption("stadium-shuttle", 4, ("high",), "Moves fans from outer transit hubs to gate approaches."),
    TransitOption("walk", 5, ("low",), "Good for nearby hotels and low-load arrival windows."),
)


async def load_match(db: asyncpg.Pool, match_id: str) -> dict[str, Any]:
    row = await db.fetchrow(
        """
        select id, venue_zone_ids, kickoff_at, home_team, away_team, transit_load_estimate
        from public.matches
        where id = $1
        """,
        match_id,
    )
    if row is None:
        raise ResourceNotFoundError(f"Match not found: {match_id}")
    return {
        "matchId": row["id"],
        "venueZoneIds": list(row["venue_zone_ids"]),
        "kickoffAt": row["kickoff_at"],
        "homeTeam": row["home_team"],
        "awayTeam": row["away_team"],
        "transitLoadEstimate": row["transit_load_estimate"],
    }


async def get_fresh_cache(db: asyncpg.Pool, match_id: str) -> list[TravelSuggestion] | None:
    row = await db.fetchrow(
        """
        select suggestions
        from public.travel_suggestions_cache
        where match_id = $1 and expire_at > now()
        """,
        match_id,
    )
    if row is None:
        return None

    suggestions = row["suggestions"]
    if isinstance(suggestions, str):
        try:
            suggestions = json.loads(suggestions)
        except json.JSONDecodeError:
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


async def cache_suggestions(db: asyncpg.Pool, match_id: str, suggestions: list[TravelSuggestion]) -> None:
    generated_at = datetime.now(tz=UTC)
    await db.execute(
        """
        insert into public.travel_suggestions_cache (match_id, generated_at, suggestions, expire_at)
        values ($1, $2, $3, $4)
        on conflict (match_id) do update
        set generated_at = excluded.generated_at,
            suggestions = excluded.suggestions,
            expire_at = excluded.expire_at
        """,
        match_id,
        generated_at,
        json.dumps([suggestion.model_dump(by_alias=True) for suggestion in suggestions]),
        generated_at + timedelta(hours=1),
    )


def travel_context(match_id: str, match: dict[str, Any]) -> tuple[list[str], TransitLoad]:
    load_estimate = match.get("transitLoadEstimate")
    if load_estimate not in {"low", "medium", "high"}:
        raise ValueError(f"Unsupported transitLoadEstimate for match {match_id}.")

    venue_zone_ids = match.get("venueZoneIds")
    if not isinstance(venue_zone_ids, list) or not all(isinstance(item, str) for item in venue_zone_ids):
        raise ValueError(f"Match {match_id} has invalid venueZoneIds.")
    return venue_zone_ids, load_estimate


def describe_options(
    options: list[TransitOption],
    load_estimate: TransitLoad,
    use_ai: bool,
) -> tuple[list[str], bool]:
    fallback = [option.note for option in options]
    if not use_ai:
        return fallback, False
    try:
        descriptions = describe_travel_options(
            [{"mode": option.mode, "note": option.note} for option in options],
            load_estimate,
        )
    except AIServiceError:
        return fallback, False
    return descriptions, True


async def get_travel_suggestions(
    match_id: str,
    db: asyncpg.Pool | None = None,
    use_ai: bool = True,
) -> TravelSuggestionsResponse:
    pool = db or await get_pool()
    cached = await get_fresh_cache(pool, match_id)
    if cached is not None:
        return TravelSuggestionsResponse(matchId=match_id, suggestions=cached)

    match = await load_match(pool, match_id)
    venue_zone_ids, load_estimate = travel_context(match_id, match)
    top_options = rank_by_load(static_transit_options_for_venue(venue_zone_ids), load_estimate)[:3]
    descriptions, used_ai_descriptions = describe_options(top_options, load_estimate, use_ai)
    suggestions = [
        TravelSuggestion(mode=option.mode, description=description)
        for option, description in zip(top_options, descriptions, strict=False)
    ]
    if used_ai_descriptions:
        await cache_suggestions(pool, match_id, suggestions)
    return TravelSuggestionsResponse(matchId=match_id, suggestions=suggestions)
