"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { useAlert } from "@/components/common/AlertProvider";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export default function InstallAppButton({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useAlert();
  const { canShow, promptNativeInstall } = usePwaInstall();

  if (!canShow) return null;

  const handleClick = () => {
    showConfirm({
      title: t("dashboard.install_title"),
      description: t("dashboard.install_confirm"),
      confirmText: t("dashboard.install_confirm_action"),
      onConfirm: () => {
        void promptNativeInstall().then((installedNative) => {
          if (installedNative) return;
          showAlert({
            title: t("dashboard.install_title"),
            description: t("dashboard.install_unavailable"),
          });
        });
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("dashboard.install_app")}
      title={t("dashboard.install_app")}
      className={`shrink-0 p-1.5 rounded-full text-on-surface-variant/55 hover:text-on-surface-variant hover:bg-surface-container-high transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`.trim()}
    >
      <span className="material-symbols-outlined text-[22px]" aria-hidden>
        download
      </span>
    </button>
  );
}
