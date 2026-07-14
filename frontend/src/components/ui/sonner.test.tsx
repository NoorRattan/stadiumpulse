import { render, screen } from "@testing-library/react";

import { ThemeProvider } from "@/contexts/ThemeContext";

import { Toaster } from "./sonner";

vi.mock("sonner", () => ({
  Toaster: ({ theme }: { theme: "light" | "dark" | "system" }) => (
    <div data-testid="sonner-toaster" data-theme={theme} />
  ),
}));

describe("Toaster", () => {
  it.each(["light", "dark"] as const)("uses the app's %s theme", (theme) => {
    window.localStorage.setItem("stadiumpulse-theme", theme);

    render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("sonner-toaster")).toHaveAttribute(
      "data-theme",
      theme,
    );
  });
});
