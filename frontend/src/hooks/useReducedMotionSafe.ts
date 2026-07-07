import { useReducedMotion } from "motion/react";
import { useContext } from "react";

import { AccessibilityContext } from "../contexts/AccessibilityContext";

/** Combines Motion's OS-level reduced-motion signal with the app override. */
export function useReducedMotionSafe(): boolean {
  const motionPrefersReduced = useReducedMotion();
  const accessibility = useContext(AccessibilityContext);
  return Boolean(accessibility?.reducedMotion ?? motionPrefersReduced);
}
