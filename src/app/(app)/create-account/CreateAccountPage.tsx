"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import AccountDetailsForm from '@/components/account/AccountDetailsForm';
import { createAccountAction } from '@/actions/app';
import { useStore } from '@/data/store';
import { useTranslation } from 'react-i18next';

export default function CreateAccountPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentUser, patchDashboardAccount } = useStore();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [iconKey, setIconKey] = useState('flight');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentUser?.id) return;
    setLoading(true);
    
    try {
      const res = await createAccountAction(currentUser.id, name.trim(), iconKey, currency);
      if (res.success && res.accountId) {
        patchDashboardAccount(res.accountId, {
          name: name.trim(),
          icon: iconKey,
          currency,
          balance: 0,
        });
        router.replace(`/account/${res.accountId}/participants`);
      } else {
        throw new Error(res.error || t("create_account.error"));
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || t("create_account.error"));
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-full flex-1 pb-24 md:pb-8 flex flex-col font-body-lg pt-16">
      <Header title={t("create_account.title")} showBack />
      
      <main className="flex-grow flex flex-col items-center justify-start px-4 py-6 overflow-y-auto">
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant p-6 flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-2">{t("create_account.heading")}</h2>
            <p className="text-sm text-on-surface-variant">{t("create_account.subtitle")}</p>
          </div>

          <AccountDetailsForm
            name={name}
            currency={currency}
            iconKey={iconKey}
            onNameChange={setName}
            onCurrencyChange={setCurrency}
            onIconChange={setIconKey}
            onSubmit={handleSubmit}
            loading={loading}
            submitIcon="add_circle"
            submitLabel={loading ? t("create_account.creating") : t("create_account.create")}
          />
        </div>
      </main>
    </div>
  );
}
