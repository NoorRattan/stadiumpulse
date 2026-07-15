import { render, type RenderResult } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";

import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";

/** Build the smallest valid auth state for page and accessibility tests. */
export function createAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: null,
    profile: null,
    role: "fan",
    loading: false,
    signInGuest: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    refreshRole: vi.fn(),
    ...overrides,
  };
}

/** Render a route-aware page with an explicit, overridable auth state. */
export function renderWithAuth(
  element: ReactElement,
  {
    authValue = createAuthValue(),
    initialEntries,
  }: { authValue?: AuthContextValue; initialEntries?: string[] } = {},
): RenderResult {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={authValue}>{element}</AuthContext.Provider>
    </MemoryRouter>,
  );
}
