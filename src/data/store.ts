"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppLanguage = "es" | "en";

export type User = {
  id: string;
  display_name: string;
  is_ghost: boolean;
  session_secret?: string;
};

export type DashboardAccount = {
  id: string;
  name: string;
  currency: string;
  icon_key?: string;
  iconKey?: string;
};

export type DashboardAccountPatch = {
  name?: string;
  icon?: string;
  currency?: string;
  balance?: number;
};

const emptyDashboard = {
  dashboardUserId: null as string | null,
  dashboardAccounts: [] as DashboardAccount[],
  dashboardBalances: {} as Record<string, number>,
};

interface AppState {
  currentUser: User | null;
  language: AppLanguage;
  dashboardUserId: string | null;
  dashboardAccounts: DashboardAccount[];
  dashboardBalances: Record<string, number>;
  setCurrentUser: (user: User | null) => void;
  setLanguage: (language: AppLanguage) => void;
  setDashboardData: (
    userId: string,
    accounts: DashboardAccount[],
    balances: Record<string, number>
  ) => void;
  patchDashboardAccount: (accountId: string, patch: DashboardAccountPatch) => void;
  removeDashboardAccount: (accountId: string) => void;
  clearDashboard: () => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      language: "es",
      ...emptyDashboard,
      setCurrentUser: (user) =>
        set((state) => ({
          currentUser: user,
          ...(state.currentUser?.id !== user?.id ? emptyDashboard : {}),
        })),
      setLanguage: (language) => set({ language }),
      setDashboardData: (userId, accounts, balances) =>
        set({
          dashboardUserId: userId,
          dashboardAccounts: accounts,
          dashboardBalances: balances,
        }),
      patchDashboardAccount: (accountId, patch) =>
        set((state) => {
          const accounts = [...state.dashboardAccounts];
          const idx = accounts.findIndex((a) => a.id === accountId);
          if (idx >= 0) {
            const prev = accounts[idx];
            accounts[idx] = {
              ...prev,
              name: patch.name ?? prev.name,
              currency: patch.currency ?? prev.currency,
              ...(patch.icon !== undefined
                ? { icon_key: patch.icon, iconKey: patch.icon }
                : {}),
            };
          } else if (patch.name) {
            accounts.unshift({
              id: accountId,
              name: patch.name,
              currency: patch.currency || "EUR",
              icon_key: patch.icon,
              iconKey: patch.icon,
            });
          }
          const balances = { ...state.dashboardBalances };
          if (patch.balance !== undefined) {
            balances[accountId] = patch.balance;
          }
          return {
            dashboardUserId: state.dashboardUserId ?? state.currentUser?.id ?? null,
            dashboardAccounts: accounts,
            dashboardBalances: balances,
          };
        }),
      removeDashboardAccount: (accountId) =>
        set((state) => {
          const balances = { ...state.dashboardBalances };
          delete balances[accountId];
          return {
            dashboardAccounts: state.dashboardAccounts.filter((a) => a.id !== accountId),
            dashboardBalances: balances,
          };
        }),
      clearDashboard: () => set(emptyDashboard),
      logout: () => set({ currentUser: null, ...emptyDashboard }),
    }),
    {
      name: "Bill Splitting App-storage",
      partialize: (state) => ({
        currentUser: state.currentUser,
        language: state.language,
      }),
      merge: (persisted, current) => {
        const stored = (persisted || {}) as Partial<AppState>;
        return {
          ...current,
          ...stored,
          language: stored.language === "en" ? "en" : "es",
        };
      },
    }
  )
);

export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persistApi = useStore.persist;
    const finish = () => setHydrated(true);

    if (!persistApi?.onFinishHydration) {
      finish();
      return;
    }

    const unsub = persistApi.onFinishHydration(finish);
    if (persistApi.hasHydrated()) finish();

    return unsub;
  }, []);

  return hydrated;
}
