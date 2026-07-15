import type { Page, Route } from "@playwright/test";

const match = {
  id: "m_2026_014",
  venue_zone_ids: ["gate-2", "section-120"],
  kickoff_at: "2026-07-15T18:00:00Z",
  home_team: "United States",
  away_team: "Canada",
  transit_load_estimate: "high",
};

const zones = [
  ["gate-2", "Gate 2", 34, "normal"],
  ["gate-4", "Gate 4", 58, "moderate"],
  ["north-concourse", "North Concourse", 76, "high"],
  ["south-concourse", "South Concourse", 88, "critical"],
  ["section-120", "Section 120", 46, "normal"],
  ["transit-plaza", "Transit Plaza", 63, "moderate"],
].map(([zoneId, name, currentDensityPct, band]) => ({
  zoneId,
  name,
  currentDensityPct,
  band,
  alert: `${name} is ${band}.`,
  lastUpdated: "2026-07-14T12:00:00Z",
}));

const demo = {
  scenarioId: "fifa-2026-matchday",
  title: "Connected match-day scenario",
  tournament: "FIFA World Cup 2026",
  generatedAt: "2026-07-14T12:00:00Z",
  dataStatus: "simulated",
  databaseStatus: "connected",
  outputSource: "curated-demo-preview",
  match: {
    matchId: match.id,
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    kickoffAt: match.kickoff_at,
    transitLoadEstimate: match.transit_load_estimate,
  },
  zones,
  accessibleRoute: {
    steps: [
      { instruction: "Enter through Gate 2.", zoneId: "gate-2" },
      { instruction: "Follow the step-free signs.", zoneId: "section-120" },
    ],
    estimatedMinutes: 6,
    congestionLevel: "low",
  },
  conciergeExamples: [
    {
      language: "English",
      question: "Where is Gate 2?",
      answer: "Use the east plaza.",
    },
  ],
  travelSuggestions: [],
  operationsDigest: {
    generatedAt: "2026-07-14T12:00:00Z",
    minutesAhead: 15,
    headline: "South Concourse needs attention",
    narrative: "Prepare the signed alternative route.",
    dataStatus: "simulated",
    items: [],
  },
  capabilities: [
    {
      label: "Multilingual concierge",
      description: "Answers practical venue questions.",
      liveEndpoint: "POST /api/concierge/chat",
    },
  ],
};

const demoIncidentDraft = {
  scenarioId: "fifa-2026-matchday",
  dataStatus: "simulated",
  generatedBy: "fallback",
  zoneId: "south-concourse",
  zoneName: "South Concourse",
  currentDensityPct: 88,
  rawInput: "Crowd pressure is rising near the accessible route merge.",
  summary:
    "Review the South Concourse route merge and prepare the signed alternative.",
  severity: "high",
  status: "draft",
  reviewRequired: true,
  persisted: false,
};

const demoVolunteerBriefing = {
  scenarioId: "fifa-2026-matchday",
  dataStatus: "simulated",
  generatedBy: "fallback",
  zoneId: "south-concourse",
  zoneName: "South Concourse",
  currentDensityPct: 88,
  shiftLabel: "Matchday volunteer shift",
  openIncidentCount: 1,
  content:
    "Guide guests toward the signed alternative and escalate accessibility support requests.",
  reviewRequired: true,
  persisted: false,
};

const experience = {
  generatedAt: "2026-07-14T12:00:00Z",
  dataStatus: "curated-and-simulated",
  tournament: {
    name: "FIFA World Cup 2026",
    startsOn: "2026-06-11",
    endsOn: "2026-07-19",
    hostCountries: ["Canada", "Mexico", "United States"],
    summary: "Connected tournament demo.",
  },
  matchTicker: [
    {
      matchId: "demo-1",
      homeTeam: "United States",
      awayTeam: "Canada",
      kickoffAt: "2026-07-15T18:00:00Z",
      venueId: "pulse-central",
      venueName: "StadiumPulse Central",
      status: "upcoming",
      score: null,
      ticketStatus: "Official FIFA availability only",
    },
  ],
  matches: [
    {
      matchId: "demo-1",
      homeTeam: "United States",
      awayTeam: "Canada",
      kickoffAt: "2026-07-15T18:00:00Z",
      venueId: "pulse-central",
      venueName: "StadiumPulse Central",
      status: "upcoming",
      score: null,
      ticketStatus: "Official FIFA availability only",
    },
  ],
  venues: [
    {
      venueId: "pulse-central",
      name: "StadiumPulse Central",
      city: "Demo City",
      country: "United States",
      address: "100 Match Day Way",
      mapLabel: "Central transit district",
      capacity: 68000,
      gates: ["Gate 2", "Accessible Gate A"],
      seatingHighlights: ["Lower bowl 100s"],
      accessibilityFeatures: ["Step-free Gate A", "Sensory room"],
    },
  ],
  amenities: [
    {
      amenityId: "food-local",
      name: "Local Kitchen",
      category: "food",
      zone: "North Concourse",
      openingNote: "Open during the demo match.",
      accessibilityNote: "Low counter available.",
    },
  ],
  fanEvents: [
    {
      eventId: "fan-zone",
      title: "Fan Zone Opening Session",
      location: "East Plaza",
      startsAt: "2026-07-15T13:00:00Z",
      description: "Synthetic fan event.",
      ticketRequired: false,
    },
  ],
  sustainability: [
    {
      metricId: "transit",
      label: "Arrivals by shared transport",
      value: "64%",
      trend: "+8 percentage points",
      explanation: "Synthetic scenario estimate.",
    },
  ],
  alerts: [
    {
      alertId: "advisory",
      severity: "advisory",
      title: "Use North Concourse",
      message: "Follow staff signs if redirected.",
      zone: "South Concourse",
      issuedAt: "2026-07-14T18:55:00Z",
    },
  ],
  faq: [
    {
      question: "Does StadiumPulse sell tickets?",
      answer: "No. Use FIFA.com/tickets.",
      category: "tickets",
    },
  ],
  officialTicketUrl: "https://www.fifa.com/tickets",
};

const backendFixtures: Record<string, object> = {
  "/api/demo": demo,
  "/api/demo/incident-draft": demoIncidentDraft,
  "/api/demo/volunteer-briefing": demoVolunteerBriefing,
  "/api/experience": experience,
  "/api/concierge/chat": {
    sessionId: "public-concierge",
    reply:
      "Gate 4 is beside the east plaza. Follow the accessible-route signs.",
    detectedLanguage: "en",
  },
  "/api/wayfinding/zones": {
    zones: [
      { zoneId: "gate-2", name: "Gate 2", type: "gate" },
      {
        zoneId: "section-120",
        name: "Section 120",
        type: "seating-block",
      },
    ],
  },
  "/api/travel/suggestions": { matchId: match.id, suggestions: [] },
};

const notFound = {
  error: {
    code: "NOT_FOUND",
    message: "Not mocked",
    status: 404,
  },
};

async function fulfillBackend(route: Route): Promise<void> {
  const url = new URL(route.request().url());
  const json = backendFixtures[url.pathname] ?? notFound;

  await route.fulfill({
    status: "error" in json ? 404 : 200,
    contentType: "application/json",
    body: JSON.stringify(json),
  });
}

/** Installs deterministic browser fixtures without bypassing rendered UI behavior. */
export async function installPublicFixtures(page: Page): Promise<void> {
  await page.route("**/api/**", fulfillBackend);
  await page.route("https://example.supabase.co/**", async (route) => {
    const url = new URL(route.request().url());
    const body = url.pathname.includes("/rest/v1/matches") ? [match] : [];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Content-Range": `0-${Math.max(0, body.length - 1)}/${body.length}`,
      },
      body: JSON.stringify(body),
    });
  });
}
