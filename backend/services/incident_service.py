from datetime import UTC, datetime

import asyncpg

from models.incident import IncidentReport, IncidentSeverity, IncidentStatus
from services.db import get_pool
from services.exceptions import AIServiceError
from services.genkit_flows import incidentTriageFlow
from services.zone_service import load_zone


async def draft_incident(
    zone_id: str,
    raw_input: str,
    reported_by_uid: str,
    db: asyncpg.Pool | None = None,
) -> IncidentReport:
    pool = db or await get_pool()
    zone = await load_zone(pool, zone_id)
    try:
        triage = incidentTriageFlow(zone.zone_id, zone.name, raw_input)
    except AIServiceError:
        triage = {
            "summary": f"Manual review needed for {zone.name}: {raw_input[:160]}",
            "severity": fallback_severity(raw_input),
        }
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


def fallback_severity(raw_input: str) -> str:
    lowered = raw_input.lower()
    if any(term in lowered for term in ("medical", "injury", "fire", "evacuation", "crush", "panic")):
        return IncidentSeverity.critical.value
    if any(term in lowered for term in ("blocked", "bottleneck", "crowd", "security", "fight")):
        return IncidentSeverity.high.value
    return IncidentSeverity.medium.value
