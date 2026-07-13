import { render, screen } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";
import { axe } from "vitest-axe";
import { MemoryRouter } from "react-router-dom";

import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";

import RolePortalPage from "./RolePortalPage";

vi.mock("@/hooks/useExperience", () => ({
  useRolePortal: (kind: string) => ({
    data: {
      portal: kind,
      role: "staff",
      generatedAt: "2026-07-14T12:00:00Z",
      dataStatus: "simulated",
      headline: "One shared operating picture",
      cards: [
        {
          cardId: "risk",
          title: "South Concourse pressure",
          detail: "Supervisor approval required.",
          status: "prepare",
          priority: "urgent",
        },
      ],
      advancedCapabilities: ["Predictive narrative", "Human approval"],
    },
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/hooks/useReducedMotionSafe", () => ({
  useReducedMotionSafe: () => true,
}));

const authValue: AuthContextValue = {
  user: {
    id: "staff-1",
    email: "staff@example.com",
    app_metadata: {},
    aud: "authenticated",
    created_at: "2026-07-14T00:00:00Z",
    user_metadata: {},
  } as User,
  profile: null,
  role: "staff",
  loading: false,
  signInGuest: vi.fn(),
  signOut: vi.fn(),
  refreshRole: vi.fn(),
};

describe("RolePortalPage", () => {
  it("renders explainable, human-reviewed command support without axe violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <RolePortalPage kind="command-center" />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Admin Command Center",
    );
    expect(
      screen.getByText(/never execute actions automatically/i),
    ).toBeInTheDocument();
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
