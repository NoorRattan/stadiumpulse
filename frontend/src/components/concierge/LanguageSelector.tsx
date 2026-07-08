import { memo, useContext, useId } from "react";

import { LanguageContext } from "@/contexts/LanguageContext";
import type { SupportedLanguage } from "@/types/domain";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languageLabels: Record<SupportedLanguage, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
  fr: "Français",
  ar: "العربية",
  de: "Deutsch",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
  hi: "हिन्दी",
};

/** Props for the concierge language combobox. */
export interface LanguageSelectorProps {
  onLanguageChange?: (language: SupportedLanguage, label: string) => void;
}

/** Accessible language combobox backed by the shared language context. */
export const LanguageSelector = memo(function LanguageSelector({
  onLanguageChange,
}: LanguageSelectorProps) {
  const labelId = useId();
  const languageContext = useContext(LanguageContext);

  if (!languageContext) {
    return null;
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-foreground" id={labelId}>
        Conversation language
      </span>
      <Select
        value={languageContext.language}
        onValueChange={(nextLanguage) => {
          languageContext.setLanguage(nextLanguage);
          const normalized = nextLanguage as SupportedLanguage;
          onLanguageChange?.(normalized, languageLabels[normalized]);
        }}
      >
        <SelectTrigger
          aria-labelledby={labelId}
          className="min-h-11 w-full max-w-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languageContext.supportedLanguages.map((language) => (
            <SelectItem key={language} value={language}>
              {languageLabels[language]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});
