import { getAccountsMeta, getDashboardBalances, getDashboardData } from "@/actions/app";
import { isAccountStale } from "./accountCache";
import { enqueueAccountPrefetch } from "./prefetchAccounts";
import { useStore, type DashboardAccount } from "./store";

export const MEMBERSHIP_TTL_MS = 60 * 60 * 1000;

function sessionKey(userId: string) {
  return `bsa-membership-checked:${userId}`;
}

export function shouldSyncMembership(
  force: boolean,
  userId: string,
  lastSync: string | null,
  hasAccounts: boolean
) {
  if (force) return true;
  if (!hasAccounts) return true;
  if (typeof window !== "undefined") {
    try {
      if (!sessionStorage.getItem(sessionKey(userId))) return true;
    } catch {
      return true;
    }
  }
  if (!lastSync) return true;
  const parsed = Date.parse(lastSync);
  if (!Number.isFinite(parsed)) return true;
  return Date.now() - parsed > MEMBERSHIP_TTL_MS;
}

function markMembershipCheckedThisSession(userId: string) {
  try {
    sessionStorage.setItem(sessionKey(userId), "1");
  } catch {
    /* ignore quota / private mode */
  }
}

function mergeAccountMeta(current: DashboardAccount[], incoming: DashboardAccount[]) {
  const byId = new Map(incoming.map((a) => [a.id, a]));
  return current.map((prev) => {
    const next = byId.get(prev.id);
    if (!next) return prev;
    return {
      ...prev,
      name: next.name,
      currency: next.currency,
      icon_key: next.icon_key || next.iconKey || prev.icon_key,
      iconKey: next.icon_key || next.iconKey || prev.iconKey,
      updated_at: next.updated_at ?? prev.updated_at,
    };
  });
}

function staleOrMissingCache(accounts: DashboardAccount[], forceAll: boolean) {
  const state = useStore.getState();
  return accounts
    .filter((a) => forceAll || isAccountStale(a, state.accountSyncedAt) || !state.accountCache[a.id])
    .map((a) => a.id);
}

function syncedMapFrom(accounts: DashboardAccount[], ids?: string[]) {
  const allow = ids ? new Set(ids) : null;
  const synced: Record<string, string> = {};
  for (const a of accounts) {
    if (allow && !allow.has(a.id)) continue;
    if (a.updated_at) synced[a.id] = a.updated_at;
  }
  return synced;
}

export async function syncDashboard(
  userId: string,
  options?: { forceMembership?: boolean; forceAll?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const forceAll = !!options?.forceAll;
  const state = useStore.getState();
  const hasAccounts = state.dashboardUserId === userId && state.dashboardAccounts.length > 0;
  const membership = shouldSyncMembership(
    !!options?.forceMembership,
    userId,
    state.lastMembershipSyncAt,
    hasAccounts
  );

  if (membership) {
    const res = await getDashboardData(userId);
    if (!res.success) return { success: false, error: res.error };
    const accounts = res.accounts || [];
    const prefetchIds = staleOrMissingCache(accounts, forceAll);
    useStore.getState().setDashboardData(userId, accounts, res.balances || {}, {
      lastMembershipSyncAt: new Date().toISOString(),
      accountSyncedAt: syncedMapFrom(accounts),
    });
    markMembershipCheckedThisSession(userId);
    enqueueAccountPrefetch(prefetchIds);
    return { success: true };
  }

  const current = useStore.getState().dashboardAccounts;
  const meta = await getAccountsMeta(current.map((a) => a.id));
  if (!meta.success) return { success: false, error: meta.error };
  const incoming = meta.accounts || [];
  const incomingIds = new Set(incoming.map((a) => a.id));
  const stillThere = current.filter((a) => incomingIds.has(a.id));
  const accounts = mergeAccountMeta(stillThere, incoming);
  useStore.getState().setDashboardAccounts(userId, accounts);

  const staleIds = accounts
    .filter((a) => forceAll || isAccountStale(a, useStore.getState().accountSyncedAt))
    .map((a) => a.id);
  const prefetchIds = staleOrMissingCache(accounts, forceAll);

  if (staleIds.length > 0) {
    const bals = await getDashboardBalances(userId, staleIds);
    if (!bals.success) return { success: false, error: bals.error };
    useStore.getState().mergeDashboardBalances(bals.balances || {});
    useStore.getState().markAccountsSynced(syncedMapFrom(accounts, staleIds));
  }

  enqueueAccountPrefetch(prefetchIds);
  return { success: true };
}
