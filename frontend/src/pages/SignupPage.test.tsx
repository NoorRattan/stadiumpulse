import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { axe } from "vitest-axe";

import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";
import { createPasswordAccount } from "@/services/authService";
import { supabase } from "@/services/supabaseConfig";

import SignupPage from "./SignupPage";

vi.mock("@/services/authService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/authService")>()),
  createPasswordAccount: vi.fn(),
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

function LocationProbe(): JSX.Element {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

describe("SignupPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders one h1 and has no axe violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <SignupPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Sign Up",
    );
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("creates a confirmed account and signs in without email verification", async () => {
    vi.mocked(createPasswordAccount).mockResolvedValue({
      uid: "supabase-user-1",
      email: "fan@example.com",
    });
    const signInWithPasswordSpy = vi.spyOn(supabase.auth, "signInWithPassword");

    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <AuthContext.Provider value={authValue}>
          <SignupPage />
          <LocationProbe />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "fan@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(createPasswordAccount).toHaveBeenCalledWith(
        "fan@example.com",
        "password123",
      ),
    );
    expect(signInWithPasswordSpy).toHaveBeenCalledWith({
      email: "fan@example.com",
      password: "password123",
    });
    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });
});
