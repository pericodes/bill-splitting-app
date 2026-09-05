"use client";

import React, { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '@/data/store';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { useAlert } from '@/components/common/AlertProvider';
import { useAccountData } from '../AccountDataProvider';
import { useTranslation } from 'react-i18next';
import { addTransactionAction } from '@/actions/app';
import { applyOptimisticExpense, reconcileOptimisticExpense, rollbackOptimisticExpense } from '@/data/accountCache';
import {
  buildCsv,
  downloadCsvFile,
  formatCsvDate,
  formatSignedAmount,
  sanitizeFilename,
} from '@/lib/csv';

const SETTLED_EPS = 0.01;

function money(amount: number, currency: string) {
  return `${amount.toFixed(2)} ${currency}`;
}

function isTransferTx(tx: { type?: string } | undefined) {
  return tx?.type === "transfer";
}

export default function BalancesPage() {
  const { t, i18n } = useTranslation();
  const { accountId: id, data } = useAccountData();
  const { currentUser } = useStore();
  const { showAlert, showConfirm } = useAlert();
  const { account, users, balances: accountBalances, entries, transactions } = data;
  const [settlingKey, setSettlingKey] = useState<string | null>(null);

  const txById = new Map<string, any>(
    (transactions || []).map((tx: { id: string }) => [tx.id, tx]),
  );

  const spentByUser: Record<string, number> = {};
  for (const entry of entries) {
    const tx = txById.get(entry.transactionId || entry.transaction_id || "");
    if (isTransferTx(tx)) continue;
    const userId = entry.userId || entry.user_id;
    const owed = parseFloat(entry.owedAmount || entry.owed_amount || "0");
    spentByUser[userId] = (spentByUser[userId] || 0) + owed;
  }

  const balances = accountBalances.map(b => {
    const userId = b.userId || b.user_id;
    const user = users.find(u => u.id === userId);
    return {
      ...b,
      userId,
      user,
      balance: parseFloat(b.balance || "0"),
      spent: spentByUser[userId] || 0,
    };
  });

  const myBalance = balances.find(b => b.userId === currentUser?.id)?.balance || 0;

  // Copies so settlement math does not wipe the individual balances shown below.
  const debtors = balances
    .filter(b => b.balance < -SETTLED_EPS)
    .map(b => ({ ...b }))
    .sort((a, b) => a.balance - b.balance);
  const creditors = balances
    .filter(b => b.balance > SETTLED_EPS)
    .map(b => ({ ...b }))
    .sort((a, b) => b.balance - a.balance);
  
  const settlements: { fromId: string; toId: string; from: string; to: string; amount: number }[] = [];
  
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debt = Math.abs(debtors[i].balance);
    const credit = creditors[j].balance;
    const amount = parseFloat(Math.min(debt, credit).toFixed(2));
    
    settlements.push({
      fromId: debtors[i].userId,
      toId: creditors[j].userId,
      from: debtors[i].user?.display_name || debtors[i].user?.displayName || t("common.unknown"),
      to: creditors[j].user?.display_name || creditors[j].user?.displayName || t("common.unknown"),
      amount
    });
    
    debtors[i].balance += amount;
    creditors[j].balance -= amount;
    
    if (Math.abs(debtors[i].balance) < SETTLED_EPS) i++;
    if (creditors[j].balance < SETTLED_EPS) j++;
  }

  const individualBalances = [...balances].sort((a, b) => b.balance - a.balance);

  const markPaid = (s: (typeof settlements)[number]) => {
    const userId = currentUser?.id;
    if (!userId || settlingKey) return;
    const key = `${s.fromId}-${s.toId}-${s.amount}`;
    showConfirm({
      title: t("balances.mark_paid_title"),
      description: t("balances.mark_paid_desc", {
        amount: s.amount.toFixed(2),
        currency: account.currency,
        from: s.from,
        to: s.to,
      }),
      confirmText: t("balances.mark_paid"),
      onConfirm: async () => {
        setSettlingKey(key);
        const splits = [
          { userId: s.fromId, paid: s.amount, owed: 0 },
          { userId: s.toId, paid: 0, owed: s.amount },
        ];
        const desc = t("balances.settle_description", { from: s.from, to: s.to }).slice(0, 140);
        const tempId = uuidv4();
        applyOptimisticExpense({
          accountId: id,
          tempId,
          description: desc,
          amount: s.amount,
          currency: account.currency || "EUR",
          createdBy: userId,
          splits,
          type: "transfer",
        });
        try {
          const res = await addTransactionAction(id, desc, s.amount, splits, userId, "transfer");
          if (res.success) {
            reconcileOptimisticExpense(id, tempId, res.transaction, res.entries || []);
          } else {
            rollbackOptimisticExpense(id, tempId, splits);
            showAlert({ title: t("common.error"), description: res.error || t("balances.mark_paid_error") });
          }
        } catch (err: any) {
          rollbackOptimisticExpense(id, tempId, splits);
          showAlert({ title: t("common.error"), description: err.message || t("balances.mark_paid_error") });
        } finally {
          setSettlingKey(null);
        }
      },
    });
  };

  const exportCsv = useCallback(() => {
    const isEnglish = i18n.language.startsWith("en");
    const separator = isEnglish ? "," : ";";

    const rows = (entries || [])
      .map((entry: any) => {
        const tx = txById.get(entry.transactionId || entry.transaction_id || "");
        if (!tx) return null;
        const paid = parseFloat(entry.paidAmount || entry.paid_amount || "0");
        const owed = parseFloat(entry.owedAmount || entry.owed_amount || "0");
        if (paid === 0 && owed === 0) return null;
        const userId = entry.userId || entry.user_id;
        const user = users.find((u: { id: string }) => u.id === userId);
        const net = parseFloat(
          entry.netAmount || entry.net_amount || String(paid - owed),
        );
        const occurredOn = tx.occurredOn || tx.occurred_on || "";
        return {
          occurredOn,
          createdAt: tx.createdAt || tx.created_at || "",
          concept: tx.description || "",
          person: user?.display_name || user?.displayName || t("common.unknown"),
          amount: net,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) =>
        a.occurredOn.localeCompare(b.occurredOn) ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.person.localeCompare(b.person),
      );

    const csv = buildCsv(
      [
        t("balances.csv_date"),
        t("balances.csv_concept"),
        t("balances.csv_person"),
        t("balances.csv_amount"),
      ],
      rows.map((row) => [
        formatCsvDate(row.occurredOn, i18n.language),
        row.concept,
        row.person,
        formatSignedAmount(row.amount, !isEnglish),
      ]),
      separator,
    );

    const filename = `${sanitizeFilename(account.name)}-${isEnglish ? "balances" : "saldos"}.csv`;
    downloadCsvFile(filename, csv);
  }, [account.name, entries, i18n.language, t, transactions, users]);

  return (
    <div className="bg-background text-on-background antialiased min-h-full flex-1 flex flex-col font-body-lg pt-16">
      <Header title={t("balances.title")} accountName={account.name} showBack />
      
      <main className="flex-1 px-4 py-6 pb-32 md:pb-6 max-w-3xl mx-auto w-full">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-on-surface-variant">{t("balances.subtitle")}</p>
          <button
            type="button"
            onClick={exportCsv}
            className="w-full sm:w-auto shrink-0 py-2 px-4 border border-primary text-primary rounded-lg font-semibold text-xs tracking-wider transition-colors hover:bg-primary-fixed-dim/10 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {t("balances.export_excel")}
          </button>
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
              {settlements.map((s) => {
                const key = `${s.fromId}-${s.toId}-${s.amount}`;
                const busy = settlingKey === key;
                return (
                  <div key={key} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-base text-on-surface">{s.from}</span>
                      <span className="material-symbols-outlined text-outline">arrow_right_alt</span>
                      <span className="font-semibold text-base text-on-surface">{s.to}</span>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                      <div className="font-semibold text-base text-primary">
                        {s.amount.toFixed(2)} {account.currency}
                      </div>
                      <button
                        type="button"
                        disabled={!!settlingKey}
                        aria-label={t("balances.mark_paid_aria", { from: s.from, to: s.to })}
                        onClick={() => markPaid(s)}
                        className="shrink-0 py-1.5 px-3 bg-primary text-on-primary rounded-lg font-semibold text-xs tracking-wider transition-colors hover:bg-primary/90 disabled:opacity-50"
                      >
                        {busy ? t("common.saving") : t("balances.mark_paid")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <h3 className="text-xl font-bold text-on-surface mb-4">{t("balances.individual")}</h3>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          {individualBalances.map((b) => {
            const isYou = b.userId === currentUser?.id;
            const theyOwe = b.balance < -SETTLED_EPS;
            const isOwed = b.balance > SETTLED_EPS;
            const statusLabel = theyOwe
              ? t("balances.they_owe")
              : isOwed
                ? t("balances.owed_to_them")
                : t("balances.settled");
            const statusClass = theyOwe
              ? "text-error"
              : isOwed
                ? "text-secondary"
                : "text-on-surface";

            return (
              <div key={b.userId} className="flex items-center justify-between gap-4 p-4 border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors">
                <div className="min-w-0">
                  <span className="font-semibold text-base text-on-surface">
                    {b.user?.display_name || b.user?.displayName} {isYou ? t("common.you_suffix") : ""}
                  </span>
                  <span className="block text-sm text-on-surface-variant">
                    {t("balances.total_spent", { amount: money(b.spent, account.currency) })}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="block text-sm text-on-surface-variant">{statusLabel}</span>
                  {(theyOwe || isOwed) && (
                    <span className={`block font-semibold text-base ${statusClass}`}>
                      {money(Math.abs(b.balance), account.currency)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
