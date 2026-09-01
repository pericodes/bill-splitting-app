"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { ACCOUNT_CURRENCIES, iconChoices } from "@/lib/accountSettings";

type AccountDetailsFormProps = {
  name: string;
  currency: string;
  iconKey: string;
  onNameChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  submitIcon?: string;
  loading?: boolean;
  children?: React.ReactNode;
};

export default function AccountDetailsForm({
  name,
  currency,
  iconKey,
  onNameChange,
  onCurrencyChange,
  onIconChange,
  onSubmit,
  submitLabel,
  submitIcon = "check",
  loading = false,
  children,
}: AccountDetailsFormProps) {
  const { t } = useTranslation();
  const icons = iconChoices(iconKey);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          {t("create_account.name")}
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t("create_account.name_placeholder")}
          className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          {t("create_account.currency")}
        </label>
        <div className="relative">
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="appearance-none w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow pr-10"
          >
            {ACCOUNT_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {t(`create_account.currency_${code.toLowerCase()}`)}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
            <span className="material-symbols-outlined">expand_more</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          {t("create_account.icon")}
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
          {icons.map((icon) => (
            <label key={icon} className="cursor-pointer relative">
              <input
                type="radio"
                name="iconKey"
                value={icon}
                checked={iconKey === icon}
                onChange={() => onIconChange(icon)}
                className="peer sr-only"
              />
              <div className="w-14 h-14 rounded-xl border border-outline-variant flex items-center justify-center transition-all duration-200 peer-checked:bg-primary-fixed peer-checked:border-primary peer-checked:text-primary hover:bg-surface-container-low text-on-surface-variant">
                <span className="material-symbols-outlined">{icon}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-on-primary font-semibold py-4 px-6 rounded-lg shadow-sm hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined">{submitIcon}</span>
          {submitLabel}
        </button>
      </div>
      {children}
    </form>
  );
}
