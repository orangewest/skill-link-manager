import { createContext, useContext, useCallback, type ReactNode } from "react";
import { translations, type TranslationKey, type Language } from "./translations";

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  children: ReactNode;
}

export function I18nProvider({ language, setLanguage, children }: I18nProviderProps) {
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      let str = translations[language][key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
