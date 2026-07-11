import { fireEvent, render, screen } from "@testing-library/react";

import { ThemeProvider } from "@/contexts/ThemeContext";

import { ThemeToggle } from "./ThemeToggle";

vi.mock("@/hooks/useReducedMotionSafe", () => ({
  useReducedMotionSafe: () => true,
}));

describe("ThemeToggle", () => {
  it("swaps instantly without mounting an overlay for reduced motion", () => {
    window.localStorage.setItem("stadiumpulse-theme", "light");
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /switch to dark/i }), {
      clientX: 40,
      clientY: 20,
    });

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.querySelector("[data-theme-wave-overlay]")).toBeNull();
  });
});
