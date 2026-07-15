import { screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { createAuthValue, renderWithAuth } from "@/testUtils";

import DashboardPage from "./DashboardPage";

vi.mock("@/services/apiClient", () => ({
  apiRequest: vi.fn().mockResolvedValue({
    generatedAt: "2026-07-12T12:00:00Z",
    minutesAhead: 15,
    headline: "No elevated zones projected",
    narrative: "Maintain routine monitoring.",
    dataStatus: "simulated",
    items: [],
  }),
}));

vi.mock("@/hooks/useCrowdDensity", () => ({
  useCrowdDensity: () => ({
    zones: [
      {
        zoneId: "gate-4",
        name: "Gate 4",
        currentDensityPct: 82,
        band: "high",
        alert: "Gate 4 is busy.",
        lastUpdated: "2026-06-15T18:42:00Z",
      },
    ],
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/hooks/useReducedMotionSafe", () => ({
  useReducedMotionSafe: () => true,
}));

const authValue = createAuthValue({ role: "staff" });

describe("DashboardPage", () => {
  it("renders one h1 and has no axe violations", async () => {
    const { container } = renderWithAuth(<DashboardPage />, { authValue });

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Crowd Overview",
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
