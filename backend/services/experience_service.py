from datetime import UTC, datetime

import asyncpg

from dependencies import AuthenticatedUser
from schemas.experience import (
    AccountExperienceResponse,
    AccountPreferences,
    AccountTicket,
    AmenityInfo,
    FanEvent,
    FaqEntry,
    PortalCard,
    PublicExperienceResponse,
    PublicMatch,
    RolePortalResponse,
    SafetyAlert,
    SustainabilityMetric,
    TournamentOverview,
    VenueInfo,
)

OFFICIAL_TICKET_URL = "https://www.fifa.com/tickets"


def build_public_experience() -> PublicExperienceResponse:
    """Return the complete public information hub with explicit demo provenance."""
    matches = [
        PublicMatch(
            matchId="demo-usa-can",
            homeTeam="United States",
            awayTeam="Canada",
            kickoffAt="2026-07-15T18:00:00Z",
            venueId="pulse-central",
            venueName="StadiumPulse Central",
            status="upcoming",
            ticketStatus="Official FIFA availability only",
        ),
        PublicMatch(
            matchId="demo-mex-jpn",
            homeTeam="Mexico",
            awayTeam="Japan",
            kickoffAt="2026-07-14T19:00:00Z",
            venueId="harbor-ground",
            venueName="Harbor Ground",
            status="live",
            score="1 - 1",
            ticketStatus="Match in progress",
        ),
        PublicMatch(
            matchId="demo-bra-fra",
            homeTeam="Brazil",
            awayTeam="France",
            kickoffAt="2026-07-16T21:00:00Z",
            venueId="north-metro",
            venueName="North Metro Stadium",
            status="upcoming",
            ticketStatus="Official FIFA availability only",
        ),
    ]
    venues = [
        VenueInfo(
            venueId="pulse-central",
            name="StadiumPulse Central",
            city="Demo City",
            country="United States",
            address="100 Match Day Way",
            mapLabel="Central transit district",
            capacity=68000,
            gates=["Gate 2", "Gate 4", "Gate 8", "Accessible Gate A"],
            seatingHighlights=["Lower bowl 100s", "Family section 214", "Supporter section 310"],
            accessibilityFeatures=["Step-free Gate A", "Wheelchair platforms", "Sensory room", "Assistive listening"],
        ),
        VenueInfo(
            venueId="harbor-ground",
            name="Harbor Ground",
            city="Demo Harbor",
            country="Canada",
            address="26 Waterfront Avenue",
            mapLabel="Harbor rail and ferry interchange",
            capacity=54000,
            gates=["North Gate", "East Gate", "Accessible Gate C"],
            seatingHighlights=["Harbor stand", "Family deck", "Quiet seating block"],
            accessibilityFeatures=["Low-gradient concourse", "Companion seating", "Changing Places restroom"],
        ),
        VenueInfo(
            venueId="north-metro",
            name="North Metro Stadium",
            city="Demo Norte",
            country="Mexico",
            address="9 Metro Plaza",
            mapLabel="North metro terminus",
            capacity=61000,
            gates=["Metro Gate", "Plaza Gate", "Accessible Gate 1"],
            seatingHighlights=["Plaza lower tier", "North stand", "Accessible terrace"],
            accessibilityFeatures=["Tactile route", "Sign-language help point", "Step-free shuttle"],
        ),
    ]
    amenities = [
        AmenityInfo(
            amenityId="food-local",
            name="Local Kitchen",
            category="food",
            zone="North Concourse",
            openingNote="Demo hours: gates open through 30 minutes after full time",
            accessibilityNote="Low counter and allergen information available",
        ),
        AmenityInfo(
            amenityId="retail-main",
            name="Tournament Store",
            category="retail",
            zone="East Plaza",
            openingNote="Demo hours: 10:00 to 23:00",
            accessibilityNote="Step-free entrance and wide aisles",
        ),
        AmenityInfo(
            amenityId="medical-1",
            name="Medical Point 1",
            category="medical",
            zone="Section 120",
            openingNote="Staffed during the synthetic match scenario",
            accessibilityNote="Step-free route from Gate 2",
        ),
        AmenityInfo(
            amenityId="quiet-room",
            name="Sensory and Quiet Room",
            category="guest-services",
            zone="South Concourse",
            openingNote="Open throughout the demo scenario",
            accessibilityNote="Low-stimulation space with trained guest-services staff",
        ),
        AmenityInfo(
            amenityId="restroom-a",
            name="Changing Places Restroom",
            category="restroom",
            zone="Accessible Gate A",
            openingNote="Available whenever gates are open",
            accessibilityNote="Adult changing table, hoist, and emergency call control",
        ),
    ]
    events = [
        FanEvent(
            eventId="fan-zone-opening",
            title="Fan Zone Opening Session",
            location="East Plaza Fan Zone",
            startsAt="2026-07-15T13:00:00Z",
            description="Synthetic programme with music, skills activities, and accessible viewing areas.",
            ticketRequired=False,
        ),
        FanEvent(
            eventId="sensory-preview",
            title="Sensory-Friendly Venue Preview",
            location="Accessible Gate A",
            startsAt="2026-07-15T14:30:00Z",
            description="A quieter orientation window showing routes, seating, and support points.",
            ticketRequired=False,
        ),
        FanEvent(
            eventId="sustainability-walk",
            title="Low-Carbon Match-Day Walk",
            location="Transit Plaza",
            startsAt="2026-07-15T15:00:00Z",
            description="A guided demo route connecting rail, shuttle, refill, and recycling points.",
            ticketRequired=False,
        ),
    ]
    sustainability = [
        SustainabilityMetric(
            metricId="public-transit",
            label="Arrivals by shared transport",
            value="64%",
            trend="+8 percentage points",
            explanation="Synthetic scenario estimate from rail, shuttle, and shared-trip choices.",
        ),
        SustainabilityMetric(
            metricId="refill",
            label="Single-use bottles avoided",
            value="12,480",
            trend="On track",
            explanation="Simulated total from refill-station throughput.",
        ),
        SustainabilityMetric(
            metricId="waste",
            label="Waste diverted",
            value="78%",
            trend="+5 percentage points",
            explanation="Simulated separation rate for compost, recycling, and residual waste.",
        ),
        SustainabilityMetric(
            metricId="energy",
            label="Renewable electricity share",
            value="82%",
            trend="Stable",
            explanation="Synthetic venue-energy mix for the connected demo.",
        ),
    ]
    alerts = [
        SafetyAlert(
            alertId="advisory-south",
            severity="advisory",
            title="Use North Concourse for a calmer route",
            message="South Concourse is elevated in the synthetic crowd scenario. Follow staff signs if redirected.",
            zone="South Concourse",
            issuedAt="2026-07-14T18:55:00Z",
        ),
        SafetyAlert(
            alertId="info-weather",
            severity="info",
            title="Hydration points open",
            message="Refill stations are available at Gates 2, 4, and Accessible Gate A.",
            zone="Venue-wide",
            issuedAt="2026-07-14T18:30:00Z",
        ),
    ]
    faq = [
        FaqEntry(
            category="tickets",
            question="Does StadiumPulse sell FIFA World Cup 2026 tickets?",
            answer=(
                "No. StadiumPulse does not sell or issue tickets. Use FIFA.com/tickets for official availability "
                "and purchases."
            ),
        ),
        FaqEntry(
            category="accessibility",
            question="Can I request a step-free route?",
            answer="Yes. Open Wayfinding, choose your start and destination, and select wheelchair or step-free needs.",
        ),
        FaqEntry(
            category="safety",
            question="Are the alerts connected to real stadium sensors?",
            answer="No. Public alerts and crowd values are synthetic demonstration data and are labelled as such.",
        ),
        FaqEntry(
            category="support",
            question="How do I get urgent help at a venue?",
            answer=(
                "Contact on-site stadium staff or local emergency services. The AI concierge is not an "
                "emergency channel."
            ),
        ),
        FaqEntry(
            category="language",
            question="Which languages does the concierge support?",
            answer=(
                "The concierge supports English, Spanish, Portuguese, French, Arabic, German, Japanese, Korean, "
                "Chinese, and Hindi."
            ),
        ),
    ]
    return PublicExperienceResponse(
        generatedAt=datetime.now(tz=UTC).isoformat(),
        dataStatus="curated-and-simulated",
        tournament=TournamentOverview(
            name="FIFA World Cup 2026",
            startsOn="2026-06-11",
            endsOn="2026-07-19",
            hostCountries=["Canada", "Mexico", "United States"],
            summary="A connected demo for the 48-team tournament across three host countries.",
        ),
        matchTicker=matches[:2],
        matches=matches,
        venues=venues,
        amenities=amenities,
        fanEvents=events,
        sustainability=sustainability,
        alerts=alerts,
        faq=faq,
        officialTicketUrl=OFFICIAL_TICKET_URL,
    )


async def build_account_experience(
    user: AuthenticatedUser,
    db: asyncpg.Pool,
) -> AccountExperienceResponse:
    """Create an identity-bound demo pass and load the user's saved accessibility preferences."""
    row = await db.fetchrow(
        """
        select high_contrast, reduced_motion, screen_reader_mode, preferred_language
        from public.accessibility_settings
        where uid = $1
        """,
        user.uid,
    )
    accessibility_needs: list[str] = []
    language = "en"
    if row is not None:
        language = str(row["preferred_language"])
        if row["high_contrast"]:
            accessibility_needs.append("high contrast")
        if row["reduced_motion"]:
            accessibility_needs.append("reduced motion")
        if row["screen_reader_mode"]:
            accessibility_needs.append("screen reader mode")
    if not accessibility_needs:
        accessibility_needs.append("No saved accessibility settings")

    return AccountExperienceResponse(
        uid=user.uid,
        role=user.role.value,
        tickets=[
            AccountTicket(
                ticketId=f"demo-{user.uid[:8]}",
                matchLabel="United States vs Canada",
                venueName="StadiumPulse Central",
                gate="Gate 2",
                seat="Section 120 / Demo 14",
                status="demo-pass",
                disclaimer="Demonstration pass only. This is not an official FIFA ticket and cannot grant venue entry.",
            )
        ],
        preferences=AccountPreferences(
            language=language,
            accessibilityNeeds=accessibility_needs,
            alertChannels=["in-app"],
            sustainabilityGoal="Prefer rail and shared shuttle routes",
        ),
    )


PORTAL_CONTENT: dict[str, tuple[str, list[PortalCard], list[str]]] = {
    "volunteer": (
        "Your next shift is ready",
        [
            PortalCard(
                cardId="shift",
                title="East Plaza welcome shift",
                detail="15:00-20:30 · report to Volunteer Point A",
                status="confirmed",
                priority="normal",
            ),
            PortalCard(
                cardId="task",
                title="Accessibility route checks",
                detail="Verify step-free signs from Gate A to Section 120",
                status="due before gates",
                priority="high",
            ),
            PortalCard(
                cardId="training",
                title="Crowd awareness refresher",
                detail="8-minute scenario training with knowledge check",
                status="not started",
                priority="normal",
            ),
        ],
        ["GenAI shift briefing", "Multilingual fan-response prompts", "Role-scoped incident visibility"],
    ),
    "operations": (
        "One shared operating picture",
        [
            PortalCard(
                cardId="crowd",
                title="South Concourse pressure",
                detail="Projected 88% in 15 minutes; supervisor approval required",
                status="prepare diversion",
                priority="urgent",
            ),
            PortalCard(
                cardId="transport",
                title="Transit arrival pulse",
                detail="Rail demand elevated; shuttle capacity available",
                status="monitor",
                priority="high",
            ),
            PortalCard(
                cardId="incidents",
                title="Open incident drafts",
                detail="Two human-reviewed drafts await staff action",
                status="review",
                priority="normal",
            ),
        ],
        ["Predictive crowd-flow narrative", "GenAI incident summaries", "Approval-gated operational digest"],
    ),
    "venue-staff": (
        "Team queues by venue function",
        [
            PortalCard(
                cardId="security",
                title="Security",
                detail="Gate 4 queue rising in synthetic feed",
                status="assign one team",
                priority="high",
            ),
            PortalCard(
                cardId="medical",
                title="Medical",
                detail="All medical points available",
                status="ready",
                priority="normal",
            ),
            PortalCard(
                cardId="cleaning",
                title="Cleaning",
                detail="North Concourse service request",
                status="dispatched",
                priority="normal",
            ),
            PortalCard(
                cardId="guest",
                title="Guest services",
                detail="Sensory room at 40% demo occupancy",
                status="available",
                priority="low",
            ),
        ],
        ["Anomaly explanations", "Auto-summarized handovers", "Cross-team priority view"],
    ),
    "command-center": (
        "Control-room decision support",
        [
            PortalCard(
                cardId="recommendation",
                title="Recommended Gate 4 metering",
                detail="Prepare a 10-minute entry pause if density crosses 90%; human approval required",
                status="recommendation",
                priority="urgent",
            ),
            PortalCard(
                cardId="confidence",
                title="Model confidence",
                detail="Medium confidence from synthetic density trend and transit load",
                status="explainable",
                priority="normal",
            ),
            PortalCard(
                cardId="audit",
                title="Decision audit trail",
                detail="No automated venue action has been executed",
                status="safe",
                priority="low",
            ),
        ],
        ["Natural-language reasoning", "Predictive anomaly detection", "Supervisor approval and audit trail"],
    ),
}


def build_role_portal(portal: str, user: AuthenticatedUser) -> RolePortalResponse:
    headline, cards, capabilities = PORTAL_CONTENT[portal]
    return RolePortalResponse(
        portal=portal,
        role=user.role.value,
        generatedAt=datetime.now(tz=UTC).isoformat(),
        dataStatus="simulated",
        headline=headline,
        cards=cards,
        advancedCapabilities=capabilities,
    )
