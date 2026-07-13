import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { MemoryRouter } from "react-router-dom";

import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";

import SupportPage, { type SupportSection } from "./SupportPage";

vi.mock("@/hooks/useReducedMotionSafe", () => ({
  useReducedMotionSafe: () => true,
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

function renderPage(section: SupportSection) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <SupportPage section={section} />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("SupportPage", () => {
  it.each([
    ["about", "One Match Day. One Shared Picture."],
    ["contact", "Contact StadiumPulse"],
    ["privacy", "Privacy in Plain Language"],
    ["terms", "Terms of Use"],
  ] as const)("renders %s with one h1", (section, heading) => {
    const { unmount } = renderPage(section);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      heading,
    );
    unmount();
  });

  it("has no axe violations on contact and exposes both support channels", async () => {
    const { container } = renderPage("contact");
    expect(
      screen.getByRole("link", { name: "Open the concierge" }),
    ).toHaveAttribute("href", "/concierge");
    expect(
      screen.getByRole("link", { name: "Open GitHub Issues" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/NoorRattan/stadiumpulse/issues",
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
