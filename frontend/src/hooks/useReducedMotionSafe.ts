import { useContext } from "react";

import { AccessibilityContext } from "../contexts/AccessibilityContext";

/** Uses the effective OS, app, and screen-reader preferences to control motion. */
export function useReducedMotionSafe(): boolean {
  const accessibility = useContext(AccessibilityContext);
  if (!accessibility && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return Boolean(
    accessibility?.reducedMotion || accessibility?.screenReaderMode,
  );
}
