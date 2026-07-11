from datetime import UTC, datetime

import asyncpg

from models.briefing import Briefing
from models.incident import IncidentReport
from models.zone import Zone
from services.crowd_service import zone_from_row
from services.db import get_pool
from services.exceptions import ResourceNotFoundError
from services.genkit_flows import briefingFlow


async def load_zone(db: asyncpg.Pool, zone_id: str) -> Zone:
    row = await db.fetchrow(
        """
        select zone_id, name, type, capacity, current_density_pct, last_updated, lat, lng
        from public.zones
        where zone_id = $1
        """,
        zone_id,
    )
    if row is None:
        raise ResourceNotFoundError(f"Zone not found: {zone_id}")
    return zone_from_row(row)


def incident_from_row(row: object) -> IncidentReport:
    data = dict(row)
    return IncidentReport(
        incidentId=str(data["id"]),
        zoneId=data["zone_id"],
        status=data["status"],
        rawInput=data["raw_input"],
        aiDraftSummary=data["ai_draft_summary"],
        severity=data["severity"],
        reportedByUid=str(data["reported_by_uid"]) if data["reported_by_uid"] is not None else None,
        createdAt=data["created_at"],
        submittedAt=data["submitted_at"],
        resolvedAt=data["resolved_at"],
    )


async def load_open_incidents(db: asyncpg.Pool, zone_id: str) -> list[IncidentReport]:
    rows = await db.fetch(
        """
        select id, zone_id, status, raw_input, ai_draft_summary, severity, reported_by_uid,
               created_at, submitted_at, resolved_at
        from public.incidents
        where zone_id = $1 and status <> 'resolved'
        order by created_at desc
        limit 20
        """,
        zone_id,
    )
    return [incident_from_row(row) for row in rows if row]


def summarize_incidents(incidents: list[IncidentReport]) -> str:
    if not incidents:
        return "None reported"
    return "; ".join(
        f"{incident.severity or 'unassigned'} {incident.status} incident: {incident.raw_input}"
        for incident in incidents
    )


def build_briefing_content(zone: Zone, shift_label: str, incidents: list[IncidentReport], paragraph: str) -> str:
    return (
        f"## {zone.name} - {shift_label}\n\n"
        f"**Zone Type:** {zone.type.value}\n"
        f"**Capacity:** {zone.capacity}\n\n"
        f"**Current Known Incidents:** {summarize_incidents(incidents)}\n\n"
        f"**Briefing:**\n{paragraph}\n\n"
        "**Standard Reminders:**\n"
        "- Report any safety concern immediately via the Incident Copilot\n"
        "- Know your nearest first-aid station and evacuation route"
    )


async def generate_briefing(
    zone_id: str,
    shift_label: str,
    generated_by_uid: str,
    db: asyncpg.Pool | None = None,
) -> Briefing:
    pool = db or await get_pool()
    zone = await load_zone(pool, zone_id)
    incidents = await load_open_incidents(pool, zone_id)
    paragraph = briefingFlow(
        zone.model_dump(by_alias=True),
        shift_label,
        [incident.model_dump(by_alias=True) for incident in incidents],
    )
    generated_at = datetime.now(tz=UTC)
    content = build_briefing_content(zone, shift_label, incidents, paragraph)
    briefing_id = await pool.fetchval(
        """
        insert into public.briefings (zone_id, shift_label, content, generated_by_uid, generated_at)
        values ($1, $2, $3, $4, $5)
        returning id
        """,
        zone.zone_id,
        shift_label,
        content,
        generated_by_uid,
        generated_at,
    )
    briefing = Briefing(
        briefingId=str(briefing_id),
        zoneId=zone.zone_id,
        shiftLabel=shift_label,
        content=content,
        generatedByUid=generated_by_uid,
        generatedAt=generated_at,
    )
    return briefing
