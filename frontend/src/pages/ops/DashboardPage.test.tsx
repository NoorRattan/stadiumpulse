import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { MemoryRouter } from "react-router-dom";

import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";

import DashboardPage from "./DashboardPage";

vi.mock("@/hooks/useCrowdDensity", () => ({
  useCrowdDensity: () => ({
    zones: [
      {
        zoneId: "gate-4",
        name: "Gate 4",
        currentDensityPct: 82,
        band: "high",
        alert: "Gate 4 is busy.",
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

const authValue: AuthContextValue = {
  user: null,
  profile: null,
  role: "staff",
  loading: false,
  signInGuest: vi.fn(),
  signOut: vi.fn(),
  refreshRole: vi.fn(),
};

describe("DashboardPage", () => {
  it("renders one h1 and has no axe violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <DashboardPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Crowd Overview",
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
