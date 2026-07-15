import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { SupportedLanguage } from "../types/domain";

/** Ordered language list supported by the backend language fallback policy. */
const supportedLanguages: readonly SupportedLanguage[] = [
  "en",
  "es",
  "pt",
  "fr",
  "ar",
  "de",
  "ja",
  "ko",
  "zh",
  "hi",
];

/** Language context value for locale-aware pages. */
export interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (language: string) => void;
  supportedLanguages: readonly SupportedLanguage[];
}

/** React context for active interface language. */
export const LanguageContext = createContext<LanguageContextValue | null>(null);

function normalizeLanguage(language: string): SupportedLanguage {
  const normalized = language.trim().toLowerCase();
  return supportedLanguages.includes(normalized as SupportedLanguage)
    ? (normalized as SupportedLanguage)
    : "en";
}

/** Provides supported language state and document direction updates. */
export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: (nextLanguage) =>
        setLanguageState(normalizeLanguage(nextLanguage)),
      supportedLanguages,
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
