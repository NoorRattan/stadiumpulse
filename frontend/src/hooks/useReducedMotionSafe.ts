import { useContext } from "react";

import { AccessibilityContext } from "../contexts/AccessibilityContext";

/** Uses the app's explicit accessibility settings to control motion. */
export function useReducedMotionSafe(): boolean {
  const accessibility = useContext(AccessibilityContext);
  return Boolean(
    accessibility?.reducedMotion || accessibility?.screenReaderMode,
  );
}
