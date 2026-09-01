"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header";
import AccountDetailsForm from "@/components/account/AccountDetailsForm";
import { useAlert } from "@/components/common/AlertProvider";
import { deleteAccountAction, updateAccountAction } from "@/actions/app";
import { patchCachedAccountDetails } from "@/data/accountCache";
import { useStore } from "@/data/store";
import { useAccountData } from "../AccountDataProvider";

export default function EditAccountPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { accountId: id, data } = useAccountData();
  const { account } = data;
  const { showAlert, showConfirm } = useAlert();
  const removeDashboardAccount = useStore((s) => s.removeDashboardAccount);

  const [name, setName] = useState(account.name || "");
  const [currency, setCurrency] = useState(account.currency || "EUR");
  const [iconKey, setIconKey] = useState(account.iconKey || account.icon_key || "flight");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving || deleting) return;
    setSaving(true);
    try {
      const res = await updateAccountAction(id, name.trim(), iconKey, currency);
      if (!res.success) {
        showAlert({ title: t("common.error"), description: res.error || t("edit_account.error") });
        return;
      }
      patchCachedAccountDetails(id, {
        name: name.trim(),
        icon: iconKey,
        currency,
        updated_at: res.updatedAt,
      });
      router.replace(`/account/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (saving || deleting) return;
    showConfirm({
      title: t("edit_account.delete_title"),
      description: t("edit_account.delete_desc", { name: account.name }),
      isDestructive: true,
      confirmText: t("common.delete"),
      onConfirm: async () => {
        setDeleting(true);
        try {
          const res = await deleteAccountAction(id);
          if (!res.success) {
            showAlert({ title: t("common.error"), description: res.error || t("edit_account.delete_error") });
            return;
          }
          removeDashboardAccount(id);
          router.replace("/dashboard");
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  const busy = saving || deleting;

  return (
    <div className="bg-background text-on-background min-h-full flex-1 pb-24 md:pb-8 flex flex-col font-body-lg pt-16">
      <Header
        title={t("edit_account.title")}
        accountName={account.name}
        showBack
        onBack={() => router.replace(`/account/${id}`)}
      />

      <main className="flex-grow flex flex-col items-center justify-start px-4 py-6 overflow-y-auto gap-6">
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant p-6 flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-2">{t("edit_account.heading")}</h2>
            <p className="text-sm text-on-surface-variant">{t("edit_account.subtitle")}</p>
          </div>

          <AccountDetailsForm
            name={name}
            currency={currency}
            iconKey={iconKey}
            onNameChange={setName}
            onCurrencyChange={setCurrency}
            onIconChange={setIconKey}
            onSubmit={handleSubmit}
            loading={busy}
            submitIcon="check"
            submitLabel={saving ? t("common.saving") : t("common.save")}
          />
        </div>

        <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-sm border border-error-container p-6 flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-error">{t("edit_account.delete_title")}</h3>
            <p className="text-sm text-on-surface-variant mt-1">{t("edit_account.delete_hint")}</p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="w-full border border-error text-error font-semibold py-4 px-6 rounded-lg hover:bg-error-container/50 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined">delete</span>
            {deleting ? t("edit_account.deleting") : t("edit_account.delete")}
          </button>
        </div>
      </main>
    </div>
  );
}
