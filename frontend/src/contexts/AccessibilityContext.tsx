import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { AuthContext, type AuthContextValue } from "./AuthContext";
import { apiRequest } from "../services/apiClient";
import type { AccessibilitySettingsResponse } from "../types/api";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

function subscribeToReducedMotion(onPreferenceChange: () => void): () => void {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return () => undefined;
  }
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onPreferenceChange);
  return () => mediaQuery.removeEventListener("change", onPreferenceChange);
}

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

type BooleanSetter = Dispatch<SetStateAction<boolean>>;
type MotionSetter = Dispatch<SetStateAction<boolean | null>>;

function useAccessibilityLoad(
  user: AuthContextValue["user"] | undefined,
  setHighContrast: BooleanSetter,
  setReducedMotion: MotionSetter,
  setScreenReaderMode: BooleanSetter,
): void {
  useEffect(() => {
    if (!user) return;
    let active = true;
    void apiRequest<AccessibilitySettingsResponse>(
      "/api/accessibility/settings",
    )
      .then((settings) => {
        if (!active) return;
        setHighContrast(settings.highContrast);
        setReducedMotion(settings.reducedMotion);
        setScreenReaderMode(settings.screenReaderMode);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [setHighContrast, setReducedMotion, setScreenReaderMode, user]);
}

function useAccessibilityPersistence(
  auth: AuthContextValue | null,
  highContrast: boolean,
  reducedMotion: boolean | null,
  screenReaderMode: boolean,
) {
  return useCallback(
    (next: Partial<AccessibilitySettingsResponse>) => {
      if (!auth?.user) return;
      void apiRequest<
        AccessibilitySettingsResponse,
        AccessibilitySettingsResponse
      >("/api/accessibility/settings", {
        method: "PUT",
        body: {
          highContrast: next.highContrast ?? highContrast,
          reducedMotion: next.reducedMotion ?? reducedMotion ?? false,
          screenReaderMode: next.screenReaderMode ?? screenReaderMode,
          preferredLanguage: auth.profile?.preferredLanguage ?? "en",
        },
      }).catch(() => undefined);
    },
    [auth, highContrast, reducedMotion, screenReaderMode],
  );
}

function useAccessibilityDocumentState(
  highContrast: boolean,
  reducedMotion: boolean,
  screenReaderMode: boolean,
): void {
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
  useEffect(() => {
    document.documentElement.dataset.motion =
      reducedMotion || screenReaderMode ? "reduced" : "full";
  }, [reducedMotion, screenReaderMode]);
}

function useAccessibilityActions(
  persist: (next: Partial<AccessibilitySettingsResponse>) => void,
  setHighContrast: BooleanSetter,
  setReducedMotion: MotionSetter,
  setScreenReaderMode: BooleanSetter,
) {
  const updateHighContrast = useCallback(
    (enabled: boolean) => {
      setHighContrast(enabled);
      persist({ highContrast: enabled });
    },
    [persist, setHighContrast],
  );
  const updateReducedMotion = useCallback(
    (enabled: boolean | null) => {
      setReducedMotion(enabled);
      persist({ reducedMotion: enabled ?? false });
    },
    [persist, setReducedMotion],
  );
  const updateScreenReaderMode = useCallback(
    (enabled: boolean) => {
      setScreenReaderMode(enabled);
      persist({ screenReaderMode: enabled });
    },
    [persist, setScreenReaderMode],
  );
  return { updateHighContrast, updateReducedMotion, updateScreenReaderMode };
}

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
  >(null);
  const systemReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    prefersReducedMotion,
    () => false,
  );
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  useAccessibilityLoad(
    auth?.user,
    setHighContrast,
    setReducedMotionOverride,
    setScreenReaderMode,
  );
  const persist = useAccessibilityPersistence(
    auth,
    highContrast,
    reducedMotionOverride,
    screenReaderMode,
  );
  const { updateHighContrast, updateReducedMotion, updateScreenReaderMode } =
    useAccessibilityActions(
      persist,
      setHighContrast,
      setReducedMotionOverride,
      setScreenReaderMode,
    );

  // A site control may request less motion, but it must never override an
  // operating-system request for reduced motion.
  const reducedMotion = systemReducedMotion || reducedMotionOverride === true;
  useAccessibilityDocumentState(highContrast, reducedMotion, screenReaderMode);
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
