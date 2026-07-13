import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";
import { axe } from "vitest-axe";
import { MemoryRouter, useLocation } from "react-router-dom";

import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";

import AccountPage from "./AccountPage";

vi.mock("@/hooks/useReducedMotionSafe", () => ({
  useReducedMotionSafe: () => true,
}));

const signedInUser = {
  id: "fan-1",
  email: "fan@example.com",
  app_metadata: {},
  aud: "authenticated",
  created_at: "2026-07-14T00:00:00Z",
  user_metadata: { full_name: "Match Day Fan" },
} as User;

function LocationProbe(): JSX.Element {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function createAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: signedInUser,
    profile: {
      uid: "fan-1",
      displayName: "Match Day Fan",
      email: "fan@example.com",
      role: "fan",
      preferredLanguage: "en",
    },
    role: "fan",
    loading: false,
    signInGuest: vi.fn(),
    signOut: vi.fn().mockResolvedValue(undefined),
    refreshRole: vi.fn(),
    ...overrides,
  };
}

describe("AccountPage", () => {
  it("shows the signed-in identity, role, destinations, and no axe violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthContext.Provider value={createAuthValue()}>
          <AccountPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Welcome, Match Day Fan.",
    );
    expect(screen.getByText("fan@example.com")).toBeInTheDocument();
    expect(screen.getByText("fan", { selector: "dd" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open wayfinding/i }),
    ).toHaveAttribute("href", "/wayfinding");
    expect(screen.queryByText("Operations workspace")).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("shows authorized operations access", () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={createAuthValue({ role: "staff" })}>
          <AccountPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: /operations workspace/i }),
    ).toHaveAttribute("href", "/ops");
  });

  it("signs out and returns home", async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <AuthContext.Provider value={createAuthValue({ signOut })}>
          <AccountPage />
          <LocationProbe />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });
});
