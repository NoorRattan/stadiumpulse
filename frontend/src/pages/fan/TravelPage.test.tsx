import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { MemoryRouter } from "react-router-dom";

import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";

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

const authValue: AuthContextValue = {
  user: null,
  profile: null,
  role: "fan",
  loading: false,
  signInGuest: vi.fn(),
  signOut: vi.fn(),
  refreshRole: vi.fn(),
};

describe("TravelPage", () => {
  it("renders one h1 and has no axe violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <TravelPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Getting Here Sustainably",
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
