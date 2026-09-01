"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccountData, getAccountMeta } from "@/actions/app";
import { isServerNewer, putAccountCacheFromServer } from "@/data/accountCache";
import { useHasHydrated, useStore, type AccountData } from "@/data/store";
import { useTranslation } from "react-i18next";

type AccountDataContextValue = {
  accountId: string;
  data: AccountData;
  loading: boolean;
  error: string | null;
  refetch: (opts?: { force?: boolean }) => Promise<void>;
};

const AccountDataContext = createContext<AccountDataContextValue | null>(null);

export function useAccountData() {
  const ctx = useContext(AccountDataContext);
  if (!ctx) {
    throw new Error("useAccountData debe usarse dentro de AccountDataProvider");
  }
  return ctx;
}

const FRESH_MS = 15_000;

function AccountSkeleton({ name, balance, currency }: { name?: string; balance?: number; currency?: string }) {
  const { t } = useTranslation();
  return (
    <div className="bg-background text-on-background min-h-full flex-1 relative font-body-lg pt-16 px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-6 pt-4">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 flex flex-col items-center gap-3">
          <h2 className="text-xl font-semibold text-on-surface">{name || t("account.loading")}</h2>
          {typeof balance === "number" && currency ? (
            <p className="text-sm text-on-surface-variant">
              {balance.toFixed(2)} {currency}
            </p>
          ) : null}
          <span className="material-symbols-outlined animate-spin text-on-surface-variant mt-2">progress_activity</span>
        </div>
      </div>
    </div>
  );
}

export function AccountDataProvider({
  accountId,
  children,
}: {
  accountId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const hasHydrated = useHasHydrated();
  const userId = useStore((s) => s.currentUser?.id);
  const cached = useStore((s) => s.accountCache[accountId]);
  const dashboardAccount = useStore((s) => s.dashboardAccounts.find((a) => a.id === accountId));
  const dashboardBalance = useStore((s) => s.dashboardBalances[accountId]);

  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const fetchGenRef = useRef(0);

  const refetch = useCallback(async (opts?: { force?: boolean }) => {
    const gen = ++fetchGenRef.current;
    const started = Date.now();
    setError(null);

    const current = useStore.getState().accountCache[accountId];
    const force = opts?.force !== false;

    if (!force && current && Date.now() - current.syncedAt < FRESH_MS) {
      setLoading(false);
      return;
    }

    if (!force && current) {
      try {
        const meta = await getAccountMeta(accountId);
        if (gen !== fetchGenRef.current) return;
        if (meta.success && meta.account && !isServerNewer(meta.account.updated_at, current.serverUpdatedAt)) {
          setLoading(false);
          return;
        }
        if (!meta.success && meta.error === "Not found") {
          useStore.getState().removeDashboardAccount(accountId);
          router.push("/dashboard");
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!current) setLoading(true);

    try {
      const res = await getAccountData(accountId);
      if (gen !== fetchGenRef.current) return;
      if (res.success && res.account) {
        putAccountCacheFromServer(accountId, {
          account: res.account,
          users: res.users || [],
          members: res.members || [],
          balances: res.balances || [],
          transactions: res.transactions || [],
          entries: res.entries || [],
        }, started);
      } else {
        useStore.getState().removeAccountCache(accountId);
        setError(res.error || "Not found");
        router.push("/dashboard");
      }
    } catch (err) {
      if (gen !== fetchGenRef.current) return;
      console.error(err);
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      if (gen === fetchGenRef.current) setLoading(false);
    }
  }, [accountId, router]);

  useEffect(() => {
    if (userId) {
      void refetch({ force: false });
      return;
    }
    if (hasHydrated) {
      router.push("/login");
    }
  }, [hasHydrated, userId, accountId, refetch, router]);

  const data = cached?.data ?? null;

  if (!hasHydrated || !userId) {
    return <div className="flex-1 flex items-center justify-center">{t("account.loading")}</div>;
  }

  if (!data) {
    if (dashboardAccount) {
      return (
        <AccountSkeleton
          name={dashboardAccount.name}
          balance={Object.prototype.hasOwnProperty.call(useStore.getState().dashboardBalances, accountId) ? dashboardBalance : undefined}
          currency={dashboardAccount.currency}
        />
      );
    }
    if (loading) {
      return <div className="flex-1 flex items-center justify-center">{t("account.loading")}</div>;
    }
    return null;
  }

  return (
    <AccountDataContext.Provider value={{ accountId, data, loading, error, refetch }}>
      {children}
    </AccountDataContext.Provider>
  );
}
