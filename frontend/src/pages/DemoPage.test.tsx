import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe } from "vitest-axe";

import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";
import { apiRequest } from "@/services/apiClient";

import DemoPage from "./DemoPage";

vi.mock("@/services/apiClient", () => ({ apiRequest: vi.fn() }));
vi.mock("@/hooks/useReducedMotionSafe", () => ({
  useReducedMotionSafe: () => true,
}));

const authValue: AuthContextValue = {
  user: null,
  profile: null,
  role: "fan",
  loading: false,
  signInGuest: vi.fn(),
  signOut: vi.fn(),
  refreshRole: vi.fn(),
};

const demoResponse = {
  scenarioId: "fifa-2026-matchday",
  title: "Demo",
  tournament: "FIFA World Cup 2026",
  generatedAt: "2026-06-15T18:00:00Z",
  dataStatus: "simulated",
  databaseStatus: "connected",
  outputSource: "curated-demo-preview",
  match: {
    matchId: "m_2026_014",
    homeTeam: "United States",
    awayTeam: "Canada",
    kickoffAt: "2026-06-15T21:00:00Z",
    transitLoadEstimate: "high",
  },
  zones: [
    {
      zoneId: "gate-2",
      name: "Gate 2",
      currentDensityPct: 30,
      band: "normal",
      alert: "Gate 2 is normal.",
      lastUpdated: "2026-06-15T18:00:00Z",
    },
  ],
  accessibleRoute: {
    steps: [{ instruction: "Start at Gate 2.", zoneId: "gate-2" }],
    estimatedMinutes: 6,
    congestionLevel: "low",
  },
  conciergeExamples: [
    { language: "English", question: "Where?", answer: "Gate 2." },
  ],
  travelSuggestions: [],
  operationsDigest: {
    generatedAt: "2026-06-15T18:00:00Z",
    minutesAhead: 15,
    headline: "No elevated zones projected",
    narrative: "Maintain routine monitoring.",
    dataStatus: "simulated",
    items: [],
  },
  capabilities: [
    {
      label: "Multilingual GenAI concierge",
      description: "Answers practical questions.",
      liveEndpoint: "POST /api/concierge/chat",
    },
  ],
};

describe("DemoPage", () => {
  it("renders the connected demo with no axe violations", async () => {
    vi.mocked(apiRequest).mockImplementation((path) => {
      if (path === "/api/demo/incident-draft") {
        return Promise.resolve({
          scenarioId: "fifa-2026-matchday",
          dataStatus: "simulated",
          generatedBy: "fallback",
          zoneId: "gate-2",
          zoneName: "Gate 2",
          currentDensityPct: 30,
          rawInput: "Connected demo context",
          summary: "Prepare a supervised alternative route.",
          severity: "medium",
          status: "draft",
          reviewRequired: true,
          persisted: false,
        });
      }
      if (path === "/api/demo/volunteer-briefing") {
        return Promise.resolve({
          scenarioId: "fifa-2026-matchday",
          dataStatus: "simulated",
          generatedBy: "fallback",
          zoneId: "gate-2",
          zoneName: "Gate 2",
          currentDensityPct: 30,
          shiftLabel: "Pre-match volunteer shift",
          openIncidentCount: 0,
          content: "Support the accessible route and escalate changes.",
          reviewRequired: true,
          persisted: false,
        });
      }
      return Promise.resolve(demoResponse);
    });
    const { container } = render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <DemoPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByText("Seeded Supabase scenario")).toBeInTheDocument(),
    );
    expect(screen.getByText(/United States vs\. Canada/)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Generate incident draft" }),
    );
    await waitFor(() =>
      expect(screen.getByText("Generated incident draft")).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Generate volunteer briefing" }),
    );
    await waitFor(() =>
      expect(
        screen.getByText("Generated volunteer briefing"),
      ).toBeInTheDocument(),
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
