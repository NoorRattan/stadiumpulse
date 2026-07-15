import { screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { createAuthValue, renderWithAuth } from "@/testUtils";

import TravelPage from "./TravelPage";

vi.mock("@/hooks/useMatches", () => ({
  useMatches: () => ({
    matches: [
      {
        matchId: "m_2026_014",
        venueZoneIds: ["gate-2"],
        kickoffAt: "2026-06-15T21:42:00Z",
        homeTeam: "United States",
        awayTeam: "Canada",
        transitLoadEstimate: "high",
      },
    ],
    loading: false,
    error: null,
  }),
}));

vi.mock("@/services/apiClient", () => ({
  apiRequest: vi.fn(),
}));

const authValue = createAuthValue();

describe("TravelPage", () => {
  it("renders one h1 and has no axe violations", async () => {
    const { container } = renderWithAuth(<TravelPage />, { authValue });

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Transport & Parking",
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
