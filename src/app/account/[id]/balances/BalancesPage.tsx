"use client";

import React from 'react';
import { useStore } from '@/data/store';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { useAccountData } from '../AccountDataProvider';
import { useTranslation } from 'react-i18next';

export default function BalancesPage() {
  const { t } = useTranslation();
  const { data } = useAccountData();
  const { currentUser } = useStore();
  const { account, users, balances: accountBalances } = data;

  const balances = accountBalances.map(b => {
    const user = users.find(u => u.id === (b.userId || b.user_id));
    return { ...b, user, balance: parseFloat(b.balance || "0") };
  });

  const myBalance = balances.find(b => (b.userId === currentUser?.id || b.user_id === currentUser?.id))?.balance || 0;

  // Simple settling up logic (who owes whom) - simplified for demo
  const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
  const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
  
  const settlements: { from: string, to: string, amount: number }[] = [];
  
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debt = Math.abs(debtors[i].balance);
    const credit = creditors[j].balance;
    const amount = Math.min(debt, credit);
    
    settlements.push({
      from: debtors[i].user?.display_name || debtors[i].user?.displayName || t("common.unknown"),
      to: creditors[j].user?.display_name || creditors[j].user?.displayName || t("common.unknown"),
      amount
    });
    
    debtors[i].balance += amount;
    creditors[j].balance -= amount;
    
    if (Math.abs(debtors[i].balance) < 0.01) i++;
    if (creditors[j].balance < 0.01) j++;
  }

  return (
    <div className="bg-background text-on-background antialiased min-h-screen flex flex-col font-body-lg pt-16">
      <Header title={t("balances.title")} accountName={account.name} showBack />
      
      <main className="flex-1 px-4 py-6 pb-32 md:pb-6 max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <p className="text-sm text-on-surface-variant">{t("balances.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{t("balances.they_owe_you")}</span>
              <div className="bg-secondary-container text-on-secondary-container rounded-full p-1 h-8 w-8 flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_downward</span>
              </div>
            </div>
            <div className="text-4xl font-bold text-on-surface">
              {myBalance > 0 ? myBalance.toFixed(2) : '0.00'} {account.currency}
            </div>
          </div>
          
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-error uppercase tracking-wider">{t("balances.you_owe")}</span>
              <div className="bg-error-container text-on-error-container rounded-full p-1 h-8 w-8 flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
              </div>
            </div>
            <div className="text-4xl font-bold text-on-surface">
              {myBalance < 0 ? Math.abs(myBalance).toFixed(2) : '0.00'} {account.currency}
            </div>
          </div>
        </div>

        {settlements.length > 0 && (
          <>
            <h3 className="text-xl font-semibold text-on-surface mb-4">{t("balances.settle_title")}</h3>
            <div className="space-y-2 mb-8">
              {settlements.map((s, idx) => (
                <div key={idx} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base text-on-surface">{s.from}</span>
                    <span className="material-symbols-outlined text-outline">arrow_right_alt</span>
                    <span className="font-semibold text-base text-on-surface">{s.to}</span>
                  </div>
                  <div className="font-semibold text-base text-primary">
                    {s.amount.toFixed(2)} {account.currency}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h3 className="text-xl font-bold text-on-surface mb-4">{t("balances.individual")}</h3>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          {balances.sort((a, b) => b.balance - a.balance).map((b, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors">
              <span className="font-semibold text-base text-on-surface">
                {b.user?.display_name || b.user?.displayName} {b.userId === currentUser?.id || b.user_id === currentUser?.id ? t("common.you_suffix") : ""}
              </span>
              <div className="text-right">
                <span className={`block font-semibold text-base ${b.balance > 0 ? 'text-secondary' : b.balance < 0 ? 'text-error' : 'text-on-surface'}`}>
                  {b.balance > 0 ? '+' : ''}{b.balance.toFixed(2)} {account.currency}
                </span>
                <span className="block text-sm text-on-surface-variant">
                  {b.balance > 0 ? t("balances.owed_to_them") : b.balance < 0 ? t("balances.they_owe") : t("balances.settled")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
