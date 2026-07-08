import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { MemoryRouter } from "react-router-dom";

import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";

import BriefingsPage from "./BriefingsPage";

vi.mock("@/hooks/useZoneOptions", () => ({
  useZoneOptions: () => ({
    zones: [{ zoneId: "gate-4", name: "Gate 4", type: "gate" }],
    loading: false,
    error: null,
  }),
}));

vi.mock("@/services/apiClient", () => ({
  apiRequest: vi.fn().mockRejectedValue(new Error("No briefing")),
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

describe("BriefingsPage", () => {
  it("renders one h1 and has no axe violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <BriefingsPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Volunteer Briefings",
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
