import { useContext, useSyncExternalStore } from "react";

import { AccessibilityContext } from "../contexts/AccessibilityContext";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void): () => void {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function readReducedMotion(): boolean {
  return window.matchMedia(reducedMotionQuery).matches;
}

/** Combines OS motion preferences with app and assistive-technology settings. */
export function useReducedMotionSafe(): boolean {
  const motionPrefersReduced = useSyncExternalStore(
    subscribeToReducedMotion,
    readReducedMotion,
    () => false,
  );
  const accessibility = useContext(AccessibilityContext);
  return Boolean(
    motionPrefersReduced ||
    accessibility?.reducedMotion ||
    accessibility?.screenReaderMode,
  );
}
