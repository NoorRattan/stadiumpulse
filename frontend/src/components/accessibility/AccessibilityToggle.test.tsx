import { render, screen } from "@testing-library/react";

import {
  AccessibilityContext,
  type AccessibilityContextValue,
} from "@/contexts/AccessibilityContext";

import { AccessibilityToggle } from "./AccessibilityToggle";

const value: AccessibilityContextValue = {
  highContrast: false,
  reducedMotion: false,
  reducedMotionOverride: null,
  screenReaderMode: false,
  setHighContrast: vi.fn(),
  setReducedMotionOverride: vi.fn(),
  setScreenReaderMode: vi.fn(),
};

describe("AccessibilityToggle", () => {
  it("renders named global accessibility checkboxes", () => {
    render(
      <AccessibilityContext.Provider value={value}>
        <AccessibilityToggle />
      </AccessibilityContext.Provider>,
    );

    expect(
      screen.getByRole("checkbox", { name: "High contrast" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Reduce motion" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Screen reader" }),
    ).toBeInTheDocument();
  });
});
