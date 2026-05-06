"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { Translations } from "./types";
import en from "./en";
import tr from "./tr";

type Locale = "en" | "tr";

const TRANSLATIONS: Record<Locale, Translations> = { en, tr };

type I18nContextType = {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  t: en,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("f1-locale") as Locale | null;
    if (saved && TRANSLATIONS[saved]) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("f1-locale", l);
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t: TRANSLATIONS[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "tr" : "en")}
      className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full bg-f1-card border border-white/10 text-xs font-body font-bold uppercase tracking-wider text-f1-grey hover:text-white transition-colors"
    >
      {locale === "en" ? "TR" : "EN"}
    </button>
  );
}
