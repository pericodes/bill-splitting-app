"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/data/store';
import Header from '@/components/layout/Header';
import { useAlert } from '@/components/common/AlertProvider';
import { deleteTransactionAction } from '@/actions/app';
import { useAccountData } from './AccountDataProvider';
import { dateFnsLocale } from '@/i18n/dateLocale';

export default function AccountPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { accountId: id, data, refetch } = useAccountData();
  const { currentUser } = useStore();
  const { showAlert, showConfirm } = useAlert();
  const { account, users, balances: accountBalances, transactions: accountTxs, entries } = data;
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const myBalance = parseFloat(accountBalances.find(b => b.userId === currentUser?.id || b.user_id === currentUser?.id)?.balance || "0");

  const handleDelete = (tx: { id: string; description?: string }) => {
    showConfirm({
      title: t("account.delete_expense_title"),
      description: t("account.delete_expense_desc", { name: tx.description || t("account.this_expense") }),
      isDestructive: true,
      confirmText: t("common.delete"),
      onConfirm: async () => {
        setDeletingId(tx.id);
        try {
          const res = await deleteTransactionAction(id, tx.id);
          if (!res.success) {
            showAlert({ title: t("common.error"), description: res.error || t("account.delete_expense_error") });
            return;
          }
          await refetch();
        } finally {
          setDeletingId(null);
        }
      },
    });
  };
  
  return (
    <div className="bg-background text-on-background min-h-screen relative font-body-lg pt-16">
      <Header title={account.name} showBack onBack={() => router.replace('/dashboard')} />
      
      <main className="pt-4 pb-8 px-4 max-w-3xl mx-auto flex flex-col gap-6">
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 flex flex-col items-center gap-4 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed to-transparent opacity-30 pointer-events-none"></div>
          
          <div className="z-10 flex flex-col items-center">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t("account.total_group")}</p>
            <h2 className="text-4xl font-bold text-on-surface mt-2">
              {accountTxs.reduce((sum, tx) => sum + parseFloat(tx.totalAmount || tx.total_amount || "0"), 0).toFixed(2)} {account.currency}
            </h2>
          </div>
          
          <div className="z-10 w-full flex flex-col items-center mt-4 gap-4">
            <div className={`w-full rounded-lg p-4 text-center ${myBalance >= 0 ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
              <p className="text-sm">{t("account.balance_in_your_favor")}</p>
              <p className={`text-base font-semibold mt-1 ${myBalance >= 0 ? 'text-secondary' : 'text-error'}`}>
                {myBalance >= 0
                  ? t("account.they_owe_you", { amount: myBalance.toFixed(2) })
                  : t("account.you_owe", { amount: Math.abs(myBalance).toFixed(2) })} {account.currency}
              </p>
            </div>
            
            <Link href={`/account/${id}/balances`} className="w-full py-2 bg-primary text-on-primary rounded-lg font-semibold text-xs tracking-wider transition-colors hover:bg-primary-fixed-dim shadow-sm flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">account_balance</span>
              {t("account.view_balances")}
            </Link>
            
            <Link href={`/account/${id}/participants`} className="w-full py-2 border border-primary text-primary rounded-lg font-semibold text-xs tracking-wider transition-colors hover:bg-primary-fixed-dim/10 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">group</span>
              {t("account.view_participants")}
            </Link>
          </div>
        </section>

        <Link
          href={`/account/${id}/expense`}
          className="w-full py-3 bg-secondary text-on-secondary rounded-lg font-semibold text-sm tracking-wider transition-colors hover:bg-secondary/90 shadow-sm shadow-secondary/30 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          {t("account.add_expense")}
        </Link>
        
        <section className="flex flex-col gap-4">
          {accountTxs.length === 0 ? (
            <div className="text-center py-10 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
              <p>{t("account.no_expenses")}</p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden divide-y divide-outline-variant flex flex-col">
              {accountTxs.map(tx => {
                const txEntries = entries.filter(e => e.transactionId === tx.id || e.transaction_id === tx.id);
                const payers = txEntries.filter(e => parseFloat(e.paidAmount || e.paid_amount || "0") > 0);
                const myEntry = txEntries.find(e => e.userId === currentUser?.id || e.user_id === currentUser?.id);
                
                let payerName = t("common.someone");
                if (payers.length === 1) {
                  const payerId = payers[0].userId || payers[0].user_id;
                  payerName = users.find(u => u.id === payerId)?.displayName || users.find(u => u.id === payerId)?.display_name || t("common.someone");
                  if (payerId === currentUser?.id) payerName = t("common.you");
                } else if (payers.length > 1) {
                  payerName = t("common.several");
                }

                const txAmount = parseFloat(tx.totalAmount || tx.total_amount || "0");
                const netAmount = parseFloat(myEntry?.netAmount || myEntry?.net_amount || "0");

                return (
                  <div key={tx.id} className="flex items-center hover:bg-surface-container-low transition-colors">
                    <Link href={`/account/${id}/expense?tx=${tx.id}`} className="flex-1 min-w-0 p-5 flex items-center gap-4 cursor-pointer no-underline text-inherit">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base text-on-surface truncate">{tx.description}</h4>
                        <p className="text-sm text-outline mt-1">
                          {format(new Date(tx.occurredOn || tx.occurred_on), 'MMM dd', { locale: dateFnsLocale(i18n.language) })} • {t("account.paid")} <span className="font-semibold">{payerName}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-lg text-on-surface tracking-tight">{txAmount.toFixed(2)} {tx.currency || account.currency}</p>
                        {myEntry && netAmount !== 0 && (
                          <p className={`text-xs font-medium mt-1 ${netAmount > 0 ? 'text-secondary' : 'text-error'}`}>
                            {netAmount > 0 ? '+' : ''}{netAmount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </Link>
                    <button
                      type="button"
                      aria-label={t("account.delete_aria", { name: tx.description })}
                      disabled={deletingId === tx.id}
                      onClick={() => handleDelete(tx)}
                      className="shrink-0 mr-3 text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-error-container/50 focus:outline-none disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {deletingId === tx.id ? "hourglass_top" : "delete"}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
