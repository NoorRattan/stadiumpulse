from typing import Any

from models.incident import IncidentSeverity
from models.route import AccessibilityNeed, RouteOption
from services.ai_core import StadiumPulseAIClient, get_ai_client
from services.exceptions import AIServiceError


def translateFlow(
    message: str,
    target_language: str,
    *,
    source_language: str | None = None,
    ai_client: StadiumPulseAIClient | None = None,
) -> dict[str, str]:
    client = ai_client or get_ai_client()
    prompt = (
        "You are StadiumPulse's multilingual concierge language layer.\n"
        "Return JSON with keys detectedLanguage and translatedText.\n"
        f"Target language: {target_language}\n"
        f"Known source language: {source_language or 'unknown'}\n"
        f"User message: {message}"
    )
    data = client.generate_json(prompt, tier="lite")
    detected = data.get("detectedLanguage")
    translated = data.get("translatedText")
    if not isinstance(detected, str) or not isinstance(translated, str):
        raise AIServiceError("Translation flow returned an invalid shape.")
    return {"detectedLanguage": detected, "translatedText": translated}


def wayfindingFlow(
    baseline_path: list[str],
    alternative_paths: list[list[str]],
    accessibility_needs: list[AccessibilityNeed],
    *,
    ai_client: StadiumPulseAIClient | None = None,
) -> list[RouteOption]:
    client = ai_client or get_ai_client()
    prompt = (
        "You are StadiumPulse's wayfinding narrator. Only narrate the supplied route paths. "
        "Do not add, remove, or reorder zones. Return JSON: "
        '{"routeOptions":[{"steps":[{"instruction":"...","zoneId":"..."}],'
        '"estimatedMinutes":6,"congestionLevel":"low"}]}.\n'
        f"Baseline path: {baseline_path}\n"
        f"Comparable alternatives: {alternative_paths}\n"
        f"Accessibility needs: {[need.value for need in accessibility_needs]}"
    )
    data = client.generate_json(prompt, tier="primary")
    options = data.get("routeOptions")
    if not isinstance(options, list):
        raise AIServiceError("Wayfinding flow returned no routeOptions list.")
    return [RouteOption.model_validate(option) for option in options]


def incidentTriageFlow(
    zone_id: str,
    zone_name: str,
    raw_input: str,
    *,
    ai_client: StadiumPulseAIClient | None = None,
) -> dict[str, str]:
    client = ai_client or get_ai_client()
    severities = [severity.value for severity in IncidentSeverity]
    prompt = (
        "You are StadiumPulse's incident triage copilot. Return JSON only with keys "
        "summary and severity. Severity must be one of the allowed values.\n"
        f"Allowed severity values: {severities}\n"
        f"Zone ID: {zone_id}\n"
        f"Zone name: {zone_name}\n"
        f"Raw report: {raw_input}"
    )
    data = client.generate_json(prompt, tier="primary")
    summary = data.get("summary")
    severity = data.get("severity")
    if not isinstance(summary, str) or not isinstance(severity, str):
        raise AIServiceError("Incident triage flow returned an invalid shape.")
    try:
        normalized_severity = IncidentSeverity(severity)
    except ValueError as exc:
        raise AIServiceError("Incident triage flow returned an unsupported severity.") from exc
    return {"summary": summary, "severity": normalized_severity.value}


def briefingFlow(
    zone: dict[str, Any],
    shift_label: str,
    open_incidents: list[dict[str, Any]],
    *,
    ai_client: StadiumPulseAIClient | None = None,
) -> str:
    client = ai_client or get_ai_client()
    prompt = (
        "Write one practical 2-4 sentence volunteer briefing paragraph for StadiumPulse. "
        "Do not include headings or bullet points; the template supplies those.\n"
        f"Zone: {zone}\n"
        f"Shift: {shift_label}\n"
        f"Open incidents: {open_incidents}"
    )
    return client.generate_text(prompt, tier="lite")


def describe_travel_options(
    options: list[dict[str, str]],
    transit_load_estimate: str,
    *,
    ai_client: StadiumPulseAIClient | None = None,
) -> list[str]:
    client = ai_client or get_ai_client()
    prompt = (
        "Write one concise fan-facing travel description for each supplied option. "
        "Do not invent new modes or destinations. Return JSON: "
        '{"descriptions":["...","..."]}.\n'
        f"Transit load estimate: {transit_load_estimate}\n"
        f"Options: {options}"
    )
    data = client.generate_json(prompt, tier="lite")
    descriptions = data.get("descriptions")
    if not isinstance(descriptions, list) or not all(isinstance(item, str) for item in descriptions):
        raise AIServiceError("Travel description flow returned an invalid shape.")
    return descriptions
