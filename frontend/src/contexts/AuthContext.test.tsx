import { render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";
import type { User } from "firebase/auth";

import { apiRequest } from "@/services/apiClient";
import type { UserProfileResponse } from "@/types/api";

import { AuthContext, AuthProvider } from "./AuthContext";

type AuthStateCallback = (user: User | null) => void;

const authHarness = vi.hoisted(() => ({
  callback: null as AuthStateCallback | null,
}));

vi.mock("firebase/auth", () => ({
  onIdTokenChanged: vi.fn((_auth: unknown, callback: AuthStateCallback) => {
    authHarness.callback = callback;
    return vi.fn();
  }),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
}));

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

const user = {
  uid: "fan-1",
  getIdTokenResult: vi.fn().mockResolvedValue({ claims: { role: "fan" } }),
} as unknown as User;

describe("AuthProvider", () => {
  beforeEach(() => {
    authHarness.callback = null;
    vi.mocked(apiRequest).mockReset();
    vi.mocked(apiRequest).mockResolvedValue(profile);
  });

  it("bootstraps once per signed-in user and exposes the returned profile", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    authHarness.callback?.(user);

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith("/api/auth/bootstrap", {
        method: "POST",
        body: {},
      }),
    );
    await waitFor(() => expect(screen.getByText("ready")).toBeInTheDocument());
    expect(screen.getByText("fan")).toBeInTheDocument();
    expect(screen.getByText("Maria Fan")).toBeInTheDocument();

    authHarness.callback?.(user);

    await waitFor(() => expect(apiRequest).toHaveBeenCalledOnce());
  });
});
