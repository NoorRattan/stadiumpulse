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
    vi.mocked(apiRequest).mockResolvedValue(demoResponse);
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
      screen.getByRole("button", { name: "Run incident replay" }),
    );
    expect(screen.getByText("Generated incident draft")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Run briefing replay" }),
    );
    expect(
      screen.getByText("Generated volunteer briefing"),
    ).toBeInTheDocument();
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
