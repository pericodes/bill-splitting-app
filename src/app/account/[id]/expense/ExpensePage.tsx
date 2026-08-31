"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/data/store';
import Header from '@/components/layout/Header';
import { useAlert } from '@/components/common/AlertProvider';
import { addTransactionAction, updateTransactionAction } from '@/actions/app';
import { formatMoney, getCurrencySymbol, isCurrencyPrefix } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { useAccountData } from '../AccountDataProvider';
import { useTranslation } from 'react-i18next';

function MoneyInput({
  currency,
  size = 'sm',
  className,
  ...inputProps
}: {
  currency: string;
  size?: 'sm' | 'lg';
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const symbol = getCurrencySymbol(currency);
  const prefix = isCurrencyPrefix(currency);
  const isLg = size === 'lg';

  return (
    <div className="relative">
      {prefix && (
        <span className={cn(
          'absolute inset-y-0 left-0 flex items-center text-on-surface-variant',
          isLg ? 'pl-3 text-4xl font-bold' : 'pl-2 font-semibold'
        )}>
          {symbol}
        </span>
      )}
      <input
        type="number"
        step="0.01"
        {...inputProps}
        className={cn(
          'block w-full bg-transparent text-right text-on-surface focus:outline-none focus:border-primary transition-colors',
          isLg
            ? cn('py-4 border-b border-outline-variant text-4xl font-bold', prefix ? 'pl-12 pr-3' : 'pl-3 pr-12')
            : cn(
                'py-2 border border-outline-variant rounded-md text-base font-semibold disabled:cursor-not-allowed',
                prefix ? 'pl-6 pr-2' : 'pl-2 pr-7'
              ),
          className
        )}
      />
      {!prefix && (
        <span className={cn(
          'absolute inset-y-0 right-0 flex items-center text-on-surface-variant',
          isLg ? 'pr-3 text-4xl font-bold' : 'pr-2 font-semibold'
        )}>
          {symbol}
        </span>
      )}
    </div>
  );
}

export default function AddExpensePage({
  txId,
}: {
  txId?: string;
}) {
  const { accountId: id, data, refetch } = useAccountData();
  const { account, users, members, transactions, entries } = data;
  const isEditing = !!txId;
  const router = useRouter();
  const { t } = useTranslation();
  const { currentUser } = useStore();
  const { showAlert } = useAlert();

  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [splits, setSplits] = useState<Record<string, { paid: number, owed: number }>>({});
  const [includedIds, setIncludedIds] = useState<string[]>([]);
  const [payerIds, setPayerIds] = useState<string[]>([]);
  const [splitPayment, setSplitPayment] = useState(false);

  useEffect(() => {
    const accMembers = members || [];
    const ids = accMembers.map((m: any) => m.userId || m.user_id);
    const initialSplits = accMembers.reduce((acc: any, m: any) => {
      const userId = m.userId || m.user_id;
      acc[userId] = { paid: 0, owed: 0 };
      return acc;
    }, {} as Record<string, { paid: number, owed: number }>);

    if (txId) {
      const tx = (transactions || []).find((t: any) => t.id === txId);
      if (!tx) {
        router.push(`/account/${id}`);
        return;
      }
      const txEntries = (entries || []).filter((e: any) => (e.transactionId || e.transaction_id) === txId);
      const total = parseFloat(tx.totalAmount || tx.total_amount || "0");
      setDescription(tx.description || "");
      setAmount(total ? String(total) : "");

      for (const e of txEntries) {
        const userId = e.userId || e.user_id;
        initialSplits[userId] = {
          paid: parseFloat(e.paidAmount || e.paid_amount || "0"),
          owed: parseFloat(e.owedAmount || e.owed_amount || "0"),
        };
      }
      setSplits(initialSplits);

      const included = Object.entries(initialSplits)
        .filter(([, s]) => (s as { owed: number }).owed > 0)
        .map(([uid]) => uid);
      setIncludedIds(included.length > 0 ? included : ids);

      const payers = Object.entries(initialSplits)
        .filter(([, s]) => (s as { paid: number }).paid > 0)
        .map(([uid]) => uid);
      setPayerIds(payers.length > 0 ? payers : (currentUser?.id ? [currentUser.id] : ids.slice(0, 1)));
      setSplitPayment(payers.length > 1);
    } else {
      setIncludedIds(ids);
      setPayerIds(currentUser?.id ? [currentUser.id] : ids.slice(0, 1));
      setSplitPayment(false);
      setSplits(initialSplits);
      setDescription("");
      setAmount("");
    }
    // Solo al cambiar de ruta (cuenta o gasto), no en cada refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, txId]);
  
  const accountMembers = members.map(m => {
    const user = users.find(u => u.id === (m.userId || m.user_id));
    return { ...m, user };
  }).filter(m => m.user !== undefined);

  const totalOwed = Object.values(splits).reduce((sum, s) => sum + (s.owed || 0), 0);
  const totalPaid = Object.values(splits).reduce((sum, s) => sum + (s.paid || 0), 0);

  const applyEqualOwed = (totalAmount: number, included: string[]) => {
    if (included.length === 0) return;
    const splitAmount = parseFloat((totalAmount / included.length).toFixed(2));
    const diff = parseFloat((totalAmount - splitAmount * included.length).toFixed(2));

    setSplits(prev => {
      const next = { ...prev };
      for (const m of accountMembers) {
        const userId = m.userId || m.user_id;
        const prevSplit = next[userId] || { paid: 0, owed: 0 };
        next[userId] = { ...prevSplit, owed: 0 };
      }
      included.forEach((userId, idx) => {
        const owed = parseFloat((idx === 0 ? splitAmount + diff : splitAmount).toFixed(2));
        const prevSplit = next[userId] || { paid: 0, owed: 0 };
        next[userId] = { ...prevSplit, owed };
      });
      return next;
    });
  };

  const applySolePayer = (userId: string, totalAmount: number) => {
    setPayerIds([userId]);
    setSplits(prev => {
      const next = { ...prev };
      for (const m of accountMembers) {
        const id = m.userId || m.user_id;
        const prevSplit = next[id] || { paid: 0, owed: 0 };
        next[id] = { ...prevSplit, paid: id === userId ? totalAmount : 0 };
      }
      return next;
    });
  };

  const setPaidAmount = (userId: string, value: number) => {
    const numAmount = parseFloat(amount) || 0;
    setSplits(prev => {
      const others = Object.entries(prev).reduce((sum, [id, s]) => (
        id === userId ? sum : sum + (s.paid || 0)
      ), 0);
      const max = Math.max(0, parseFloat((numAmount - others).toFixed(2)));
      const paid = parseFloat(Math.min(Math.max(0, value), max).toFixed(2));
      return { ...prev, [userId]: { ...(prev[userId] || { paid: 0, owed: 0 }), paid } };
    });
  };

  const handleEqualSplit = () => {
    applyEqualOwed(parseFloat(amount) || 0, includedIds);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val);
    const numVal = parseFloat(val) || 0;
    applyEqualOwed(numVal, includedIds);
    if (!splitPayment) {
      const payerId = payerIds[0] || currentUser?.id;
      if (payerId) applySolePayer(payerId, numVal);
    }
  };

  const toggleIncluded = (userId: string) => {
    const isIncluded = includedIds.includes(userId);
    if (isIncluded && includedIds.length === 1) return;
    const next = isIncluded
      ? includedIds.filter(id => id !== userId)
      : [...includedIds, userId];
    setIncludedIds(next);
    applyEqualOwed(parseFloat(amount) || 0, next);
  };

  const togglePayer = (userId: string) => {
    const isPayer = payerIds.includes(userId);
    if (isPayer && payerIds.length === 1) return;
    if (isPayer) {
      setPayerIds(payerIds.filter(id => id !== userId));
      setPaidAmount(userId, 0);
      return;
    }
    setPayerIds([...payerIds, userId]);
  };

  const startSplitPayment = () => {
    setSplitPayment(true);
  };

  const stopSplitPayment = () => {
    const payerId = payerIds[0] || currentUser?.id;
    setSplitPayment(false);
    if (payerId) applySolePayer(payerId, parseFloat(amount) || 0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount <= 0) {
      showAlert({ title: t("common.error"), description: t("expense.amount_positive") });
      return;
    }
    
    if (Math.abs(totalOwed - numAmount) > 0.05 || Math.abs(totalPaid - numAmount) > 0.05) {
      showAlert({ 
        title: t("expense.balance_error_title"), 
        description: t("expense.balance_error", { paid: totalPaid, owed: totalOwed, total: numAmount }) 
      });
      return;
    }

    const splitArray = Object.entries(splits).map(([userId, s]) => ({
      userId,
      paid: s.paid,
      owed: s.owed
    }));

    if (saving) return;

    setSaving(true);
    try {
      const res = txId
        ? await updateTransactionAction(id, txId, description || t("expense.default_description"), numAmount, splitArray)
        : await addTransactionAction(id, description || t("expense.default_description"), numAmount, splitArray);
      if (res.success) {
        await refetch();
        router.push(`/account/${id}`);
      } else {
        showAlert({ title: t("common.error"), description: res.error || t("expense.save_error") });
      }
    } catch (err: any) {
      showAlert({ title: t("common.error"), description: err.message || t("expense.save_error") });
    } finally {
      setSaving(false);
    }
  };

  const currency = account.currency || 'EUR';
  const numAmount = parseFloat(amount) || 0;
  const pendingPaid = parseFloat((numAmount - totalPaid).toFixed(2));
  const solePayerId = payerIds[0] || currentUser?.id || '';

  const memberLabel = (m: any) => {
    const userId = m.userId || m.user_id;
    const name = m.user?.displayName || m.user?.display_name || '';
    return userId === currentUser?.id ? `${name} ${t("common.you_suffix")}` : name;
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col antialiased pt-16">
      {saving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80">
          {t("expense.saving")}
        </div>
      )}
      <Header title={isEditing ? t("expense.edit") : t("expense.add")} accountName={account.name} showBack />
      
      <main className="flex-1 overflow-y-auto p-4 pb-24 max-w-2xl mx-auto w-full">
        <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm mb-6">
          <div className="mb-6">
            <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">{t("expense.amount")}</label>
            <div className="relative">
              <MoneyInput
                currency={currency}
                size="lg"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">{t("expense.concept")}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("expense.concept_placeholder")}
              className="block w-full px-3 py-3 border border-outline-variant rounded-lg bg-transparent text-base text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-on-surface">{t("expense.who_paid")}</h2>
            {splitPayment && (
              <button
                type="button"
                onClick={stopSplitPayment}
                className="text-xs font-semibold text-primary underline"
              >
                {t("expense.single_payer")}
              </button>
            )}
          </div>

          {!splitPayment ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <select
                    value={solePayerId}
                    onChange={(e) => applySolePayer(e.target.value, numAmount)}
                    className="appearance-none w-full px-3 py-2 rounded-md border border-outline-variant bg-transparent text-base text-on-surface focus:outline-none focus:border-primary pr-10"
                  >
                    {accountMembers.map((m) => {
                      const userId = m.userId || m.user_id;
                      return (
                        <option key={userId} value={userId}>
                          {memberLabel(m)}
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </div>
                </div>
                <div className="w-32 shrink-0">
                  <MoneyInput
                    currency={currency}
                    disabled
                    value={amount === '' ? '' : numAmount.toFixed(2)}
                    className="bg-surface-container text-on-surface-variant cursor-not-allowed"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={startSplitPayment}
                className="w-full py-2.5 border border-dashed border-primary text-primary rounded-lg font-semibold text-sm transition-colors hover:bg-primary-fixed-dim/10 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">call_split</span>
                {t("expense.split_payment")}
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-5">
                {accountMembers.map((m) => {
                  const userId = m.userId || m.user_id;
                  const selected = payerIds.includes(userId);
                  return (
                    <button
                      key={userId}
                      type="button"
                      onClick={() => togglePayer(userId)}
                      aria-pressed={selected}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                        selected
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary'
                      }`}
                    >
                      {memberLabel(m)}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4">
                {accountMembers.filter(m => payerIds.includes(m.userId || m.user_id)).map((m) => {
                  const userId = m.userId || m.user_id;
                  const othersPaid = totalPaid - (splits[userId]?.paid || 0);
                  const maxPaid = Math.max(0, parseFloat((numAmount - othersPaid).toFixed(2)));
                  return (
                    <div key={userId} className="flex items-center justify-between border-b border-surface-container pb-3 last:border-0">
                      <span className="text-base text-on-surface">{memberLabel(m)}</span>
                      <div className="w-32">
                        <MoneyInput
                          currency={currency}
                          min="0"
                          max={maxPaid}
                          value={splits[userId]?.paid || ''}
                          onChange={(e) => setPaidAmount(userId, parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">{t("expense.pending")}</span>
                <span className={`font-semibold ${Math.abs(pendingPaid) > 0.009 ? 'text-error' : 'text-on-surface'}`}>
                  {formatMoney(pendingPaid, currency)}
                </span>
              </div>
              <div className="mt-2 flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">{t("expense.total_paid")}</span>
                <span className={`font-semibold ${Math.abs(totalPaid - numAmount) > 0.05 ? 'text-error' : 'text-on-surface'}`}>
                  {totalPaid.toFixed(2)} / {numAmount.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-on-surface">{t("expense.split_debt")}</h2>
            <button 
              type="button" 
              onClick={handleEqualSplit}
              className="text-xs font-semibold text-primary underline"
            >
              {t("expense.equal_parts")}
            </button>
          </div>
          
          <div className="space-y-4">
            {accountMembers.map((m) => {
              const userId = m.userId || m.user_id;
              const selected = includedIds.includes(userId);
              return (
                <div key={userId} className={`flex items-center justify-between border-b border-surface-container pb-3 last:border-0 ${selected ? '' : 'opacity-40'}`}>
                  <label className="flex items-center gap-3 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleIncluded(userId)}
                      className="h-5 w-5 shrink-0 rounded border-outline-variant accent-primary"
                    />
                    <span className="text-base text-on-surface">{memberLabel(m)}</span>
                  </label>
                  <div className="w-32">
                    <MoneyInput
                      currency={currency}
                      disabled={!selected}
                      value={splits[userId]?.owed || ''}
                      onChange={(e) => setSplits({
                        ...splits, 
                        [userId]: { ...splits[userId], owed: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between items-center text-sm">
            <span className="text-on-surface-variant">{t("expense.total_assigned")}</span>
            <span className={`font-semibold ${Math.abs(totalOwed - (parseFloat(amount) || 0)) > 0.05 ? 'text-error' : 'text-on-surface'}`}>
              {totalOwed.toFixed(2)} / {(parseFloat(amount) || 0).toFixed(2)}
            </span>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-surface to-transparent pb-8">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-secondary text-on-secondary text-xl font-bold py-4 rounded-xl shadow-lg shadow-secondary/30 hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined">{saving ? "hourglass_top" : "check"}</span>
            {saving ? t("expense.saving") : isEditing ? t("expense.save_changes") : t("expense.save_expense")}
          </button>
        </div>
      </div>
    </div>
  );
}
