import asyncpg

from models.zone import Zone
from schemas.responses import DemoBriefingResponse, DemoIncidentDraftResponse
from services.briefing_service import generate_briefing_content, load_open_incidents
from services.crowd_service import load_zones
from services.exceptions import ResourceNotFoundError
from services.incident_service import generate_incident_draft_content

DEMO_SCENARIO_ID = "fifa-2026-matchday"
DEMO_SHIFT_LABEL = "Pre-match - Gates Open to Kickoff"


def select_demo_pressure_zone(zones: list[Zone]) -> Zone:
    """Select the current highest-density zone from the connected demo seed."""
    if not zones:
        raise ResourceNotFoundError("The FIFA 2026 demo seed has not been applied.")
    return max(zones, key=lambda zone: zone.current_density_pct)


async def generate_demo_incident_draft(db: asyncpg.Pool) -> DemoIncidentDraftResponse:
    """Generate an ephemeral incident draft from a bounded connected signal."""
    zone = select_demo_pressure_zone(await load_zones(db))
    raw_input = (
        f"Synthetic crowd signal: {zone.name} is at {zone.current_density_pct:.1f}% density. "
        "Prepare a review-only response for the venue supervisor."
    )
    draft = generate_incident_draft_content(zone, raw_input)
    return DemoIncidentDraftResponse(
        scenarioId=DEMO_SCENARIO_ID,
        dataStatus="simulated",
        generatedBy=draft.generated_by,
        zoneId=zone.zone_id,
        zoneName=zone.name,
        currentDensityPct=zone.current_density_pct,
        rawInput=raw_input,
        summary=draft.summary,
        severity=draft.severity,
        status="draft",
        reviewRequired=True,
        persisted=False,
    )


async def generate_demo_volunteer_briefing(db: asyncpg.Pool) -> DemoBriefingResponse:
    """Generate an ephemeral volunteer briefing from bounded connected context."""
    zone = select_demo_pressure_zone(await load_zones(db))
    incidents = await load_open_incidents(db, zone.zone_id)
    briefing = generate_briefing_content(zone, DEMO_SHIFT_LABEL, incidents)
    return DemoBriefingResponse(
        scenarioId=DEMO_SCENARIO_ID,
        dataStatus="simulated",
        generatedBy=briefing.generated_by,
        zoneId=zone.zone_id,
        zoneName=zone.name,
        currentDensityPct=zone.current_density_pct,
        shiftLabel=DEMO_SHIFT_LABEL,
        openIncidentCount=len(incidents),
        content=briefing.content,
        reviewRequired=True,
        persisted=False,
    )
