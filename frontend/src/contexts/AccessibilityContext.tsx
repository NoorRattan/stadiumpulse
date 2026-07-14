import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AuthContext } from "./AuthContext";
import { apiRequest } from "../services/apiClient";
import type { AccessibilitySettingsResponse } from "../types/api";

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

/** Provides high-contrast, explicit reduced-motion, and screen-reader state. */
export function AccessibilityProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const auth = useContext(AuthContext);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotionOverride, setReducedMotionOverride] = useState<
    boolean | null
  >(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);

  useEffect(() => {
    if (!auth?.user) return;
    let active = true;
    void apiRequest<AccessibilitySettingsResponse>(
      "/api/accessibility/settings",
    )
      .then((settings) => {
        if (!active) return;
        setHighContrast(settings.highContrast);
        setReducedMotionOverride(settings.reducedMotion);
        setScreenReaderMode(settings.screenReaderMode);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [auth?.user]);

  const persist = useCallback(
    (next: Partial<AccessibilitySettingsResponse>) => {
      if (!auth?.user) return;
      void apiRequest<
        AccessibilitySettingsResponse,
        AccessibilitySettingsResponse
      >("/api/accessibility/settings", {
        method: "PUT",
        body: {
          highContrast: next.highContrast ?? highContrast,
          reducedMotion: next.reducedMotion ?? reducedMotionOverride ?? false,
          screenReaderMode: next.screenReaderMode ?? screenReaderMode,
          preferredLanguage: auth.profile?.preferredLanguage ?? "en",
        },
      }).catch(() => undefined);
    },
    [auth, highContrast, reducedMotionOverride, screenReaderMode],
  );

  const updateHighContrast = useCallback(
    (enabled: boolean) => {
      setHighContrast(enabled);
      persist({ highContrast: enabled });
    },
    [persist],
  );
  const updateReducedMotion = useCallback(
    (enabled: boolean | null) => {
      setReducedMotionOverride(enabled);
      persist({ reducedMotion: enabled ?? false });
    },
    [persist],
  );
  const updateScreenReaderMode = useCallback(
    (enabled: boolean) => {
      setScreenReaderMode(enabled);
      persist({ screenReaderMode: enabled });
    },
    [persist],
  );

  useEffect(() => {
    document.documentElement.dataset.contrast = highContrast
      ? "high"
      : "standard";
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.dataset.screenReader = screenReaderMode
      ? "enhanced"
      : "standard";
  }, [screenReaderMode]);

  const reducedMotion = reducedMotionOverride ?? false;

  useEffect(() => {
    document.documentElement.dataset.motion =
      reducedMotion || screenReaderMode ? "reduced" : "full";
  }, [reducedMotion, screenReaderMode]);
  const value = useMemo<AccessibilityContextValue>(
    () => ({
      highContrast,
      reducedMotion,
      reducedMotionOverride,
      screenReaderMode,
      setHighContrast: updateHighContrast,
      setReducedMotionOverride: updateReducedMotion,
      setScreenReaderMode: updateScreenReaderMode,
    }),
    [
      highContrast,
      reducedMotion,
      reducedMotionOverride,
      screenReaderMode,
      updateHighContrast,
      updateReducedMotion,
      updateScreenReaderMode,
    ],
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}
