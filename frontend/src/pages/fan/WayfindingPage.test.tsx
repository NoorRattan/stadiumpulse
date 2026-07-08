import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { MemoryRouter } from "react-router-dom";

import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";

import WayfindingPage from "./WayfindingPage";

vi.mock("@/hooks/useZoneOptions", () => ({
  useZoneOptions: () => ({
    zones: [
      { zoneId: "gate-2", name: "Gate 2", type: "gate" },
      { zoneId: "seat-block-114", name: "Section 114", type: "seating-block" },
    ],
    loading: false,
    error: null,
  }),
}));

vi.mock("@/hooks/useWayfinding", () => ({
  useWayfinding: () => ({
    route: null,
    loading: false,
    error: null,
    getRoute: vi.fn(),
    reset: vi.fn(),
  }),
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

describe("WayfindingPage", () => {
  it("renders one h1 and has no axe violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <WayfindingPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Find Your Way",
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
