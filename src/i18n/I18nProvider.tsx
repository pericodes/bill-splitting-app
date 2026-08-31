"use client";

import { useEffect } from "react";
import i18n from "@/i18n";
import { useHasHydrated, useStore } from "@/data/store";

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useStore((s) => (s.language === "en" ? "en" : "es"));
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    if (!hasHydrated) return;
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
    document.documentElement.lang = language;
  }, [hasHydrated, language]);

  return children;
}
