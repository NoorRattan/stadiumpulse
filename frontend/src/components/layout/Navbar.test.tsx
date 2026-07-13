import { fireEvent, render, screen, within } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";
import { MemoryRouter } from "react-router-dom";

import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";

import { Navbar } from "./Navbar";

const fanAuth: AuthContextValue = {
  user: null,
  profile: null,
  role: "fan",
  loading: false,
  signInGuest: vi.fn(),
  signOut: vi.fn(),
  refreshRole: vi.fn(),
};

describe("Navbar", () => {
  it("replaces sign in with an account destination for authenticated users", () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            ...fanAuth,
            user: {
              id: "fan-1",
              email: "fan@example.com",
              user_metadata: {},
            } as User,
          }}
        >
          <Navbar />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(
      screen.queryByRole("link", { name: "Sign in" }),
    ).not.toBeInTheDocument();
  });

  it("opens a labelled, task-first mobile menu", () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={fanAuth}>
          <Navbar />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole("button", { name: "Menu" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(menuButton);

    const mobileNavigation = screen.getByRole("navigation", {
      name: "Mobile navigation",
    });
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(
      within(mobileNavigation).getByRole("link", { name: /Plan a route/ }),
    ).toBeInTheDocument();
    expect(
      within(mobileNavigation).getByRole("link", { name: /Ask for help/ }),
    ).toBeInTheDocument();
    expect(
      within(mobileNavigation).getByRole("link", { name: /Travel/ }),
    ).toBeInTheDocument();
  });

  it("closes the menu when a destination is selected", () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={fanAuth}>
          <Navbar />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const mobileNavigation = screen.getByRole("navigation", {
      name: "Mobile navigation",
    });
    fireEvent.click(
      within(mobileNavigation).getByRole("link", { name: /Live demo/ }),
    );

    expect(
      screen.queryByRole("navigation", { name: "Mobile navigation" }),
    ).not.toBeInTheDocument();
  });
});
