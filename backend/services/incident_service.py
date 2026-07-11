from datetime import UTC, datetime

import asyncpg

from models.incident import IncidentReport, IncidentSeverity, IncidentStatus
from models.zone import Zone
from services.crowd_service import zone_from_row
from services.db import get_pool
from services.exceptions import AIServiceError, ResourceNotFoundError
from services.genkit_flows import incidentTriageFlow


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


async def draft_incident(
    zone_id: str,
    raw_input: str,
    reported_by_uid: str,
    db: asyncpg.Pool | None = None,
) -> IncidentReport:
    pool = db or await get_pool()
    zone = await load_zone(pool, zone_id)
    triage = incidentTriageFlow(zone.zone_id, zone.name, raw_input)
    try:
        severity = IncidentSeverity(triage["severity"])
    except ValueError as exc:
        raise AIServiceError("Incident triage returned an unsupported severity.") from exc
    created_at = datetime.now(tz=UTC)
    incident_id = await pool.fetchval(
        """
        insert into public.incidents (
          zone_id, status, raw_input, ai_draft_summary, severity, reported_by_uid, created_at,
          submitted_at, resolved_at
        )
        values ($1, 'draft', $2, $3, $4, $5, $6, null, null)
        returning id
        """,
        zone.zone_id,
        raw_input,
        triage["summary"],
        severity.value,
        reported_by_uid,
        created_at,
    )
    incident = IncidentReport(
        incidentId=str(incident_id),
        zoneId=zone.zone_id,
        status=IncidentStatus.draft,
        rawInput=raw_input,
        aiDraftSummary=triage["summary"],
        severity=severity,
        reportedByUid=reported_by_uid,
        createdAt=created_at,
        submittedAt=None,
        resolvedAt=None,
    )
    return incident
