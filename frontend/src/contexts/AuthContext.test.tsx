import { render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";
import type { Session } from "@supabase/supabase-js";

import { apiRequest } from "@/services/apiClient";
import type { UserProfileResponse } from "@/types/api";

import { AuthContext, AuthProvider } from "./AuthContext";

type AuthStateCallback = (session: Session | null) => void;

const authHarness = vi.hoisted(() => ({
  callback: null as AuthStateCallback | null,
  unsubscribe: vi.fn(),
}));

vi.mock("@/services/supabaseConfig", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(
        (_callbackEvent: unknown, callback: AuthStateCallback) => {
          authHarness.callback = callback;
          return {
            data: { subscription: { unsubscribe: authHarness.unsubscribe } },
          };
        },
      ),
      signInAnonymously: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock("@/services/authService", async () => {
  const actual = await vi.importActual<typeof import("@/services/authService")>(
    "@/services/authService",
  );
  return {
    ...actual,
    subscribeToAuthState: vi.fn((callback: AuthStateCallback) => {
      authHarness.callback = callback;
      return authHarness.unsubscribe;
    }),
  };
});

vi.mock("@/services/apiClient", () => ({
  apiRequest: vi.fn(),
}));

function AuthProbe(): JSX.Element {
  const auth = useContext(AuthContext);
  return (
    <dl>
      <dt>loading</dt>
      <dd>{auth?.loading ? "loading" : "ready"}</dd>
      <dt>role</dt>
      <dd>{auth?.role}</dd>
      <dt>profile</dt>
      <dd>{auth?.profile?.displayName ?? "none"}</dd>
    </dl>
  );
}

const profile: UserProfileResponse = {
  uid: "fan-1",
  displayName: "Maria Fan",
  role: "fan",
  preferredLanguage: "en",
};

const session = {
  access_token: "header.payload.signature",
  user: { id: "fan-1" },
} as Session;

describe("AuthProvider", () => {
  beforeEach(() => {
    authHarness.callback = null;
    authHarness.unsubscribe.mockClear();
    vi.mocked(apiRequest).mockReset();
    vi.mocked(apiRequest).mockResolvedValue(profile);
  });

  it("bootstraps once per signed-in user and exposes the returned profile", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    authHarness.callback?.(session);

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith("/api/auth/bootstrap", {
        method: "POST",
        body: {},
      }),
    );
    await waitFor(() => expect(screen.getByText("ready")).toBeInTheDocument());
    expect(screen.getByText("fan")).toBeInTheDocument();
    expect(screen.getByText("Maria Fan")).toBeInTheDocument();

    authHarness.callback?.(session);

    await waitFor(() => expect(apiRequest).toHaveBeenCalledOnce());
  });
});
