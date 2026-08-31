"use client";

import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p>{t("not_found.message")}</p>
      </div>
    </div>
  );
}
