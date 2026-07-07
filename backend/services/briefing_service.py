from datetime import UTC, datetime

from google.cloud import firestore

from models.briefing import Briefing
from models.incident import IncidentReport
from models.zone import Zone
from services.exceptions import ResourceNotFoundError
from services.firestore_client import get_firestore_client
from services.genkit_flows import briefingFlow


def load_zone(db: firestore.Client, zone_id: str) -> Zone:
    snapshot = db.collection("zones").document(zone_id).get()
    data = snapshot.to_dict() if snapshot.exists else None
    if not data:
        raise ResourceNotFoundError(f"Zone not found: {zone_id}")
    return Zone(zoneId=snapshot.id, **data)


def load_open_incidents(db: firestore.Client, zone_id: str) -> list[IncidentReport]:
    snapshots = (
        db.collection("incidents").where("zoneId", "==", zone_id).where("status", "!=", "resolved").limit(20).stream()
    )
    incidents: list[IncidentReport] = []
    for snapshot in snapshots:
        data = snapshot.to_dict()
        if data:
            incidents.append(IncidentReport(incidentId=snapshot.id, **data))
    return incidents


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


def generate_briefing(
    zone_id: str,
    shift_label: str,
    generated_by_uid: str,
    db: firestore.Client | None = None,
) -> Briefing:
    firestore_client = db or get_firestore_client()
    zone = load_zone(firestore_client, zone_id)
    incidents = load_open_incidents(firestore_client, zone_id)
    paragraph = briefingFlow(
        zone.model_dump(by_alias=True),
        shift_label,
        [incident.model_dump(by_alias=True) for incident in incidents],
    )
    generated_at = datetime.now(tz=UTC)
    briefing_ref = firestore_client.collection("briefings").document()
    briefing = Briefing(
        briefingId=briefing_ref.id,
        zoneId=zone.zone_id,
        shiftLabel=shift_label,
        content=build_briefing_content(zone, shift_label, incidents, paragraph),
        generatedByUid=generated_by_uid,
        generatedAt=generated_at,
    )
    briefing_ref.set(briefing.model_dump(by_alias=True, exclude={"briefing_id"}))
    return briefing
