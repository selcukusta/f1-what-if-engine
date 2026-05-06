"use client";

import { ReactNode } from "react";
import { I18nProvider, LanguageToggle } from "@/i18n/context";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <LanguageToggle />
      {children}
    </I18nProvider>
  );
}
