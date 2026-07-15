import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  AccessibilityContext,
  type AccessibilityContextValue,
} from "@/contexts/AccessibilityContext";

import { useReducedMotionSafe } from "./useReducedMotionSafe";

const basePreferences: AccessibilityContextValue = {
  highContrast: false,
  reducedMotion: false,
  reducedMotionOverride: null,
  screenReaderMode: false,
  setHighContrast: vi.fn(),
  setReducedMotionOverride: vi.fn(),
  setScreenReaderMode: vi.fn(),
};

function wrapperFor(value: AccessibilityContextValue) {
  return function MotionPreferenceWrapper({
    children,
  }: {
    children: ReactNode;
  }) {
    return (
      <AccessibilityContext.Provider value={value}>
        {children}
      </AccessibilityContext.Provider>
    );
  };
}

describe("useReducedMotionSafe", () => {
  it("honors enhanced screen-reader mode", () => {
    const { result } = renderHook(useReducedMotionSafe, {
      wrapper: wrapperFor({ ...basePreferences, screenReaderMode: true }),
    });

    expect(result.current).toBe(true);
  });

  it("honors the operating-system preference without a provider", () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(useReducedMotionSafe);

    expect(result.current).toBe(true);
  });

  it("honors the app's explicit reduced-motion setting", () => {
    const { result } = renderHook(useReducedMotionSafe, {
      wrapper: wrapperFor({ ...basePreferences, reducedMotion: true }),
    });

    expect(result.current).toBe(true);
  });
});
