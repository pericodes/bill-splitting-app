"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccountData } from "@/actions/app";
import { useHasHydrated, useStore } from "@/data/store";
import { useTranslation } from "react-i18next";

export type AccountData = {
  account: any;
  users: any[];
  members: any[];
  balances: any[];
  transactions: any[];
  entries: any[];
};

type AccountDataContextValue = {
  accountId: string;
  data: AccountData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const AccountDataContext = createContext<AccountDataContextValue | null>(null);

export function useAccountData() {
  const ctx = useContext(AccountDataContext);
  if (!ctx) {
    throw new Error("useAccountData debe usarse dentro de AccountDataProvider");
  }
  return ctx;
}

function sortTransactions(transactions: any[]) {
  return [...transactions].sort(
    (a, b) =>
      new Date(b.occurredOn || b.occurred_on).getTime() -
      new Date(a.occurredOn || a.occurred_on).getTime()
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
  const patchDashboardAccount = useStore((s) => s.patchDashboardAccount);

  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef<AccountData | null>(null);
  const loadedIdRef = useRef<string | null>(null);
  const fetchGenRef = useRef(0);

  const refetch = useCallback(async () => {
    const gen = ++fetchGenRef.current;
    setError(null);
    if (!dataRef.current || loadedIdRef.current !== accountId) {
      setLoading(true);
    }

    try {
      const res = await getAccountData(accountId);
      if (gen !== fetchGenRef.current) return;
      if (res.success && res.account) {
        const next: AccountData = {
          account: res.account,
          users: res.users || [],
          members: res.members || [],
          balances: res.balances || [],
          transactions: sortTransactions(res.transactions || []),
          entries: res.entries || [],
        };
        dataRef.current = next;
        loadedIdRef.current = accountId;
        setData(next);

        const myBal = next.balances.find(
          (b: { user_id?: string; userId?: string }) =>
            (b.user_id || b.userId) === userId
        );
        patchDashboardAccount(accountId, {
          name: next.account.name,
          icon: next.account.icon_key || next.account.iconKey,
          currency: next.account.currency,
          balance: parseFloat(String(myBal?.balance ?? 0)),
        });
      } else {
        dataRef.current = null;
        loadedIdRef.current = null;
        setData(null);
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
  }, [accountId, router, userId, patchDashboardAccount]);

  useEffect(() => {
    if (userId) {
      void refetch();
      return;
    }
    if (hasHydrated) {
      router.push("/login");
    }
  }, [hasHydrated, userId, accountId, refetch, router]);

  if (!userId || (loading && !data) || (data && loadedIdRef.current !== accountId && loading)) {
    return <div className="flex-1 flex items-center justify-center">{t("account.loading")}</div>;
  }

  if (!data) return null;

  return (
    <AccountDataContext.Provider value={{ accountId, data, loading, error, refetch }}>
      {children}
    </AccountDataContext.Provider>
  );
}
