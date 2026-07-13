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

async function fulfillBackend(route: Route): Promise<void> {
  const url = new URL(route.request().url());
  const json = url.pathname.endsWith("/api/demo")
    ? demo
    : url.pathname.endsWith("/api/wayfinding/zones")
      ? {
          zones: [
            { zoneId: "gate-2", name: "Gate 2", type: "gate" },
            {
              zoneId: "section-120",
              name: "Section 120",
              type: "seating-block",
            },
          ],
        }
      : url.pathname.endsWith("/api/travel/suggestions")
        ? { matchId: match.id, suggestions: [] }
        : { error: { code: "NOT_FOUND", message: "Not mocked", status: 404 } };

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
