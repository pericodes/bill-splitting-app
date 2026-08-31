"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";

export default function AppNotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex items-center justify-center bg-surface text-on-surface">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p>{t("not_found.message")}</p>
        <Link href="/dashboard" className="mt-6 inline-block font-semibold text-primary hover:underline">
          {t("nav.accounts")}
        </Link>
      </div>
    </div>
  );
}
