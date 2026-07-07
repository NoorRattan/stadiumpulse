from datetime import UTC, datetime

from google.cloud import firestore

from models.incident import IncidentReport, IncidentSeverity, IncidentStatus
from models.zone import Zone
from services.exceptions import AIServiceError, ResourceNotFoundError
from services.firestore_client import get_firestore_client
from services.genkit_flows import incidentTriageFlow


def load_zone(db: firestore.Client, zone_id: str) -> Zone:
    snapshot = db.collection("zones").document(zone_id).get()
    data = snapshot.to_dict() if snapshot.exists else None
    if not data:
        raise ResourceNotFoundError(f"Zone not found: {zone_id}")
    return Zone(zoneId=snapshot.id, **data)


def draft_incident(
    zone_id: str,
    raw_input: str,
    reported_by_uid: str,
    db: firestore.Client | None = None,
) -> IncidentReport:
    firestore_client = db or get_firestore_client()
    zone = load_zone(firestore_client, zone_id)
    triage = incidentTriageFlow(zone.zone_id, zone.name, raw_input)
    try:
        severity = IncidentSeverity(triage["severity"])
    except ValueError as exc:
        raise AIServiceError("Incident triage returned an unsupported severity.") from exc
    created_at = datetime.now(tz=UTC)
    incident_ref = firestore_client.collection("incidents").document()
    incident = IncidentReport(
        incidentId=incident_ref.id,
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
    incident_ref.set(incident.model_dump(by_alias=True, exclude={"incident_id"}))
    return incident
