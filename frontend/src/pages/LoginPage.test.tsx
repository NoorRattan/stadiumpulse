import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
import { MemoryRouter, useLocation } from "react-router-dom";

import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabaseConfig";

import LoginPage from "./LoginPage";

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

describe("LoginPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders one h1 and has no axe violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <LoginPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Sign In",
    );
    expect(
      screen.getByRole("link", { name: /create an account/i }),
    ).toHaveAttribute("href", "/signup");
    expect(
      screen.getByRole("button", { name: /continue as guest/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open public demo/i }),
    ).toHaveAttribute("href", "/demo");
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("opens the public demo for guest access", () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <LoginPage />
          <LocationProbe />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /continue as guest/i }));

    expect(screen.getByTestId("location")).toHaveTextContent("/demo");
    expect(authValue.signInGuest).not.toHaveBeenCalled();
  });

  it("opens the account page after a successful email sign-in", async () => {
    const signInWithPasswordSpy = vi
      .spyOn(supabase.auth, "signInWithPassword")
      .mockResolvedValueOnce({
        data: { user: null, session: null },
        error: null,
      } as never);

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthContext.Provider value={authValue}>
          <LoginPage />
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
    fireEvent.click(
      screen.getByRole("button", { name: /continue with email/i }),
    );

    await waitFor(() => expect(signInWithPasswordSpy).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/account"),
    );
  });

  it("does not show a verification resend flow when Supabase reports an unconfirmed email", async () => {
    const signInWithPasswordSpy = vi.spyOn(supabase.auth, "signInWithPassword");

    signInWithPasswordSpy.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: {
        message: "Email not confirmed",
        code: "email_not_confirmed",
        status: 400,
      } as never,
    });

    render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <LoginPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "jnoorrattan@gmail.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue with email/i }),
    );

    await waitFor(() => expect(signInWithPasswordSpy).toHaveBeenCalledOnce());
    expect(
      screen.queryByRole("button", { name: /resend confirmation email/i }),
    ).not.toBeInTheDocument();
  });
});
