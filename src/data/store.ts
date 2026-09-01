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
  updated_at?: string | null;
};

export type DashboardAccountPatch = {
  name?: string;
  icon?: string;
  currency?: string;
  balance?: number;
  updated_at?: string | null;
};

export type AccountData = {
  account: any;
  users: any[];
  members: any[];
  balances: any[];
  transactions: any[];
  entries: any[];
};

export type AccountCacheEntry = {
  data: AccountData;
  syncedAt: number;
  serverUpdatedAt: string | null;
};

const emptyDashboard = {
  dashboardUserId: null as string | null,
  dashboardAccounts: [] as DashboardAccount[],
  dashboardBalances: {} as Record<string, number>,
  lastMembershipSyncAt: null as string | null,
  accountSyncedAt: {} as Record<string, string>,
  accountCache: {} as Record<string, AccountCacheEntry>,
};

interface AppState {
  currentUser: User | null;
  language: AppLanguage;
  dashboardUserId: string | null;
  dashboardAccounts: DashboardAccount[];
  dashboardBalances: Record<string, number>;
  lastMembershipSyncAt: string | null;
  accountSyncedAt: Record<string, string>;
  accountCache: Record<string, AccountCacheEntry>;
  setCurrentUser: (user: User | null) => void;
  setLanguage: (language: AppLanguage) => void;
  setDashboardData: (
    userId: string,
    accounts: DashboardAccount[],
    balances: Record<string, number>,
    extras?: { lastMembershipSyncAt?: string; accountSyncedAt?: Record<string, string> }
  ) => void;
  setDashboardAccounts: (userId: string, accounts: DashboardAccount[]) => void;
  mergeDashboardBalances: (balances: Record<string, number>) => void;
  markAccountsSynced: (syncedAt: Record<string, string>) => void;
  setLastMembershipSyncAt: (iso: string) => void;
  patchDashboardAccount: (accountId: string, patch: DashboardAccountPatch) => void;
  removeDashboardAccount: (accountId: string) => void;
  setAccountCache: (accountId: string, entry: AccountCacheEntry) => void;
  removeAccountCache: (accountId: string) => void;
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
      setDashboardData: (userId, accounts, balances, extras) =>
        set((state) => {
          const keep = new Set(accounts.map((a) => a.id));
          const accountSyncedAt = {
            ...(extras?.accountSyncedAt
              ? { ...state.accountSyncedAt, ...extras.accountSyncedAt }
              : state.accountSyncedAt),
          };
          const accountCache = { ...state.accountCache };
          for (const id of Object.keys(accountSyncedAt)) {
            if (!keep.has(id)) delete accountSyncedAt[id];
          }
          for (const id of Object.keys(accountCache)) {
            if (!keep.has(id)) delete accountCache[id];
          }
          return {
            dashboardUserId: userId,
            dashboardAccounts: accounts,
            dashboardBalances: balances,
            lastMembershipSyncAt: extras?.lastMembershipSyncAt ?? state.lastMembershipSyncAt,
            accountSyncedAt,
            accountCache,
          };
        }),
      setDashboardAccounts: (userId, accounts) =>
        set((state) => {
          const keep = new Set(accounts.map((a) => a.id));
          const balances = { ...state.dashboardBalances };
          const accountSyncedAt = { ...state.accountSyncedAt };
          const accountCache = { ...state.accountCache };
          for (const id of Object.keys(balances)) {
            if (!keep.has(id)) delete balances[id];
          }
          for (const id of Object.keys(accountSyncedAt)) {
            if (!keep.has(id)) delete accountSyncedAt[id];
          }
          for (const id of Object.keys(accountCache)) {
            if (!keep.has(id)) delete accountCache[id];
          }
          return {
            dashboardUserId: userId,
            dashboardAccounts: accounts,
            dashboardBalances: balances,
            accountSyncedAt,
            accountCache,
          };
        }),
      mergeDashboardBalances: (balances) =>
        set((state) => ({
          dashboardBalances: { ...state.dashboardBalances, ...balances },
        })),
      markAccountsSynced: (syncedAt) =>
        set((state) => ({
          accountSyncedAt: { ...state.accountSyncedAt, ...syncedAt },
        })),
      setLastMembershipSyncAt: (iso) => set({ lastMembershipSyncAt: iso }),
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
              updated_at: patch.updated_at !== undefined ? patch.updated_at : prev.updated_at,
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
              updated_at: patch.updated_at ?? null,
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
          const accountSyncedAt = { ...state.accountSyncedAt };
          delete accountSyncedAt[accountId];
          const accountCache = { ...state.accountCache };
          delete accountCache[accountId];
          return {
            dashboardAccounts: state.dashboardAccounts.filter((a) => a.id !== accountId),
            dashboardBalances: balances,
            accountSyncedAt,
            accountCache,
          };
        }),
      setAccountCache: (accountId, entry) =>
        set((state) => ({
          accountCache: { ...state.accountCache, [accountId]: entry },
        })),
      removeAccountCache: (accountId) =>
        set((state) => {
          const accountCache = { ...state.accountCache };
          delete accountCache[accountId];
          return { accountCache };
        }),
      clearDashboard: () => set(emptyDashboard),
      logout: () => set({ currentUser: null, ...emptyDashboard }),
    }),
    {
      name: "Bill Splitting App-storage",
      partialize: (state) => ({
        currentUser: state.currentUser,
        language: state.language,
        dashboardUserId: state.dashboardUserId,
        dashboardAccounts: state.dashboardAccounts,
        dashboardBalances: state.dashboardBalances,
        lastMembershipSyncAt: state.lastMembershipSyncAt,
        accountSyncedAt: state.accountSyncedAt,
        accountCache: state.accountCache,
      }),
      merge: (persisted, current) => {
        const stored = (persisted || {}) as Partial<AppState>;
        return {
          ...current,
          ...stored,
          language: stored.language === "en" ? "en" : "es",
          dashboardAccounts: stored.dashboardAccounts || [],
          dashboardBalances: stored.dashboardBalances || {},
          lastMembershipSyncAt: stored.lastMembershipSyncAt ?? null,
          accountSyncedAt: stored.accountSyncedAt || {},
          accountCache: stored.accountCache || {},
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
