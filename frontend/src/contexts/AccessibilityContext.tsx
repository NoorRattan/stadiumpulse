import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Accessibility preference state used by pages and animation hooks. */
export interface AccessibilityContextValue {
  highContrast: boolean;
  reducedMotion: boolean;
  reducedMotionOverride: boolean | null;
  screenReaderMode: boolean;
  setHighContrast: (enabled: boolean) => void;
  setReducedMotionOverride: (enabled: boolean | null) => void;
  setScreenReaderMode: (enabled: boolean) => void;
}

/** React context for accessibility preferences. */
export const AccessibilityContext =
  createContext<AccessibilityContextValue | null>(null);

function readPrefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Provides high-contrast, reduced-motion, and screen-reader preference state. */
export function AccessibilityProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [highContrast, setHighContrast] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    readPrefersReducedMotion,
  );
  const [reducedMotionOverride, setReducedMotionOverride] = useState<
    boolean | null
  >(null);
  const [screenReaderMode, setScreenReaderMode] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (): void => setPrefersReducedMotion(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.contrast = highContrast
      ? "high"
      : "standard";
  }, [highContrast]);

  const reducedMotion = reducedMotionOverride ?? prefersReducedMotion;
  const value = useMemo<AccessibilityContextValue>(
    () => ({
      highContrast,
      reducedMotion,
      reducedMotionOverride,
      screenReaderMode,
      setHighContrast,
      setReducedMotionOverride,
      setScreenReaderMode,
    }),
    [highContrast, reducedMotion, reducedMotionOverride, screenReaderMode],
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}
