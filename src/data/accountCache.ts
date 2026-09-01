import { v4 as uuidv4 } from "uuid";
import { useStore, type AccountData, type DashboardAccount } from "./store";

export function txCreatedAt(tx: {
  createdAt?: string;
  created_at?: string;
  occurredOn?: string;
  occurred_on?: string;
}) {
  const raw = tx.createdAt || tx.created_at || tx.occurredOn || tx.occurred_on;
  return raw ? new Date(raw).getTime() : 0;
}

export function sortTransactions(transactions: any[]) {
  return [...transactions].sort((a, b) => txCreatedAt(b) - txCreatedAt(a));
}

export function accountUpdatedAt(row: { updated_at?: string | null; updatedAt?: string | null } | null | undefined) {
  return row?.updated_at || row?.updatedAt || null;
}

export function isServerNewer(serverUpdatedAt: string | null | undefined, localUpdatedAt: string | null | undefined) {
  if (!serverUpdatedAt) return false;
  if (!localUpdatedAt) return true;
  const server = Date.parse(serverUpdatedAt);
  const local = Date.parse(localUpdatedAt);
  if (!Number.isFinite(server)) return true;
  if (!Number.isFinite(local)) return true;
  return server > local;
}

export function isAccountStale(account: DashboardAccount, syncedAtMap: Record<string, string>) {
  return isServerNewer(account.updated_at, syncedAtMap[account.id]);
}

function rowUserId(row: { user_id?: string; userId?: string }) {
  return row.user_id || row.userId;
}

function parseBalance(value: string | number | undefined) {
  const n = parseFloat(String(value ?? 0));
  return Number.isFinite(n) ? n : 0;
}

export function accountToDashboardPatch(data: AccountData, userId?: string | null) {
  const myBal = data.balances.find((b: { user_id?: string; userId?: string }) => rowUserId(b) === userId);
  return {
    name: data.account.name,
    icon: data.account.icon_key || data.account.iconKey,
    currency: data.account.currency,
    balance: parseBalance(myBal?.balance),
    updated_at: accountUpdatedAt(data.account),
  };
}

export function patchCachedAccountDetails(
  accountId: string,
  patch: { name: string; icon: string; currency: string; updated_at?: string | null }
) {
  const state = useStore.getState();
  const cached = state.accountCache[accountId];
  const updatedAt = patch.updated_at || new Date().toISOString();

  if (cached) {
    state.setAccountCache(accountId, {
      data: {
        ...cached.data,
        account: {
          ...cached.data.account,
          name: patch.name,
          icon_key: patch.icon,
          iconKey: patch.icon,
          currency: patch.currency,
          updated_at: updatedAt,
          updatedAt,
        },
      },
      syncedAt: Date.now(),
      serverUpdatedAt: updatedAt,
    });
  }

  state.patchDashboardAccount(accountId, {
    name: patch.name,
    icon: patch.icon,
    currency: patch.currency,
    updated_at: updatedAt,
  });
  state.markAccountsSynced({ [accountId]: updatedAt });
}

export function putAccountCacheFromServer(accountId: string, data: AccountData, fetchStartedAt: number) {
  const current = useStore.getState().accountCache[accountId];
  if (current && current.syncedAt > fetchStartedAt) return;

  const next: AccountData = {
    ...data,
    transactions: sortTransactions(data.transactions || []),
  };
  useStore.getState().setAccountCache(accountId, {
    data: next,
    syncedAt: Date.now(),
    serverUpdatedAt: accountUpdatedAt(next.account),
  });

  const userId = useStore.getState().currentUser?.id;
  useStore.getState().patchDashboardAccount(accountId, accountToDashboardPatch(next, userId));
  const updatedAt = accountUpdatedAt(next.account);
  if (updatedAt) {
    useStore.getState().markAccountsSynced({ [accountId]: updatedAt });
  }
}

function applyDeltasToBalances(balances: any[], deltas: { userId: string; delta: number }[]) {
  const next = balances.map((b) => ({ ...b }));
  for (const { userId, delta } of deltas) {
    const idx = next.findIndex((b) => rowUserId(b) === userId);
    if (idx >= 0) {
      const value = parseBalance(next[idx].balance) + delta;
      next[idx] = { ...next[idx], balance: value.toFixed(2) };
    } else {
      next.push({ user_id: userId, userId, balance: delta.toFixed(2) });
    }
  }
  return next;
}

export function applyOptimisticExpense(params: {
  accountId: string;
  tempId: string;
  description: string;
  amount: number;
  currency: string;
  createdBy: string;
  splits: { userId: string; paid: number; owed: number }[];
}) {
  const { accountId, tempId, description, amount, currency, createdBy, splits } = params;
  const state = useStore.getState();
  const cached = state.accountCache[accountId];
  if (!cached) return;

  const now = new Date();
  const occurredOn = now.toISOString().slice(0, 10);
  const tx = {
    id: tempId,
    account_id: accountId,
    accountId,
    type: "expense",
    description,
    total_amount: amount.toString(),
    totalAmount: amount.toString(),
    currency,
    occurred_on: occurredOn,
    occurredOn,
    created_by: createdBy,
    createdBy,
    created_at: now.toISOString(),
    createdAt: now.toISOString(),
  };
  const entries = splits.map((split) => {
    const net = split.paid - split.owed;
    return {
      id: uuidv4(),
      transaction_id: tempId,
      transactionId: tempId,
      account_id: accountId,
      accountId,
      user_id: split.userId,
      userId: split.userId,
      paid_amount: split.paid.toString(),
      paidAmount: split.paid.toString(),
      owed_amount: split.owed.toString(),
      owedAmount: split.owed.toString(),
      net_amount: net.toString(),
      netAmount: net.toString(),
    };
  });
  const deltas = splits.map((split) => ({ userId: split.userId, delta: split.paid - split.owed }));
  const nextData: AccountData = {
    ...cached.data,
    account: {
      ...cached.data.account,
      updated_at: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    transactions: sortTransactions([tx, ...cached.data.transactions]),
    entries: [...entries, ...cached.data.entries],
    balances: applyDeltasToBalances(cached.data.balances, deltas),
  };

  state.setAccountCache(accountId, {
    data: nextData,
    syncedAt: Date.now(),
    serverUpdatedAt: now.toISOString(),
  });

  const myDelta = deltas.find((d) => d.userId === state.currentUser?.id)?.delta ?? 0;
  const prevBal = state.dashboardBalances[accountId];
  if (typeof prevBal === "number") {
    state.patchDashboardAccount(accountId, { balance: prevBal + myDelta });
  } else {
    const myBal = nextData.balances.find((b) => rowUserId(b) === state.currentUser?.id);
    state.patchDashboardAccount(accountId, { balance: parseBalance(myBal?.balance) });
  }

  return { deltas };
}

export function reconcileOptimisticExpense(
  accountId: string,
  tempId: string,
  transaction: any,
  entries: any[]
) {
  const state = useStore.getState();
  const cached = state.accountCache[accountId];
  if (!cached) return;
  if (!cached.data.transactions.some((tx: { id: string }) => tx.id === tempId)) return;

  const realId = transaction?.id || tempId;
  const nextTxs = cached.data.transactions.map((tx: { id: string }) =>
    tx.id === tempId ? { ...tx, ...transaction, id: realId } : tx
  );
  const serverEntries = (entries || []).map((e) => ({
    ...e,
    transaction_id: e.transaction_id || e.transactionId || realId,
    transactionId: e.transactionId || e.transaction_id || realId,
  }));
  const kept = cached.data.entries.filter(
    (e: { transaction_id?: string; transactionId?: string }) =>
      (e.transaction_id || e.transactionId) !== tempId
  );

  state.setAccountCache(accountId, {
    ...cached,
    data: {
      ...cached.data,
      transactions: sortTransactions(nextTxs),
      entries: serverEntries.length > 0 ? [...serverEntries, ...kept] : cached.data.entries.map((e: any) =>
        (e.transaction_id || e.transactionId) === tempId
          ? { ...e, transaction_id: realId, transactionId: realId }
          : e
      ),
    },
  });
}

export function rollbackOptimisticExpense(
  accountId: string,
  tempId: string,
  splits: { userId: string; paid: number; owed: number }[]
) {
  const state = useStore.getState();
  const cached = state.accountCache[accountId];
  if (!cached) return;

  const deltas = splits.map((split) => ({ userId: split.userId, delta: -(split.paid - split.owed) }));
  const nextData: AccountData = {
    ...cached.data,
    transactions: cached.data.transactions.filter((tx: { id: string }) => tx.id !== tempId),
    entries: cached.data.entries.filter(
      (e: { transaction_id?: string; transactionId?: string }) =>
        (e.transaction_id || e.transactionId) !== tempId
    ),
    balances: applyDeltasToBalances(cached.data.balances, deltas),
  };

  state.setAccountCache(accountId, {
    data: nextData,
    syncedAt: Date.now(),
    serverUpdatedAt: accountUpdatedAt(nextData.account),
  });

  const myDelta = deltas.find((d) => d.userId === state.currentUser?.id)?.delta ?? 0;
  const prevBal = state.dashboardBalances[accountId];
  if (typeof prevBal === "number") {
    state.patchDashboardAccount(accountId, { balance: prevBal + myDelta });
  }
}
