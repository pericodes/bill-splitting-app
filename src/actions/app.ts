"use server"

import { dataApi, throwIfApiError } from "@/data/dataApi";
import { isAccountCurrency, isAccountIcon } from "@/lib/accountSettings";
import { verifyNeonSession } from "@/lib/neonSession";

function userIdOf(row: { user_id?: string; userId?: string }) {
  return row.user_id || row.userId;
}

type AppUserPayload = {
  id: string;
  display_name: string;
  is_ghost: boolean;
  session_secret?: string;
};

function toAppUser(
  user: { id: string; display_name?: string; displayName?: string; is_ghost?: boolean; isGhost?: boolean },
  secret?: { session_secret?: string; sessionSecret?: string } | null
): AppUserPayload {
  return {
    id: user.id,
    display_name: user.display_name || user.displayName || "",
    is_ghost: !!(user.is_ghost ?? user.isGhost),
    session_secret: secret?.session_secret || secret?.sessionSecret,
  };
}

function fallbackDisplayName(name?: string, email?: string) {
  const fromName = name?.trim();
  if (fromName) return fromName.slice(0, 60);
  const fromEmail = email?.split("@")[0]?.trim();
  if (fromEmail) return fromEmail.slice(0, 60);
  return "Usuario";
}

async function loadUserWithSecret(userId: string): Promise<AppUserPayload> {
  const { data: user, error: userError } = await dataApi.from("users").select("*").eq("id", userId).single();
  throwIfApiError(userError, "No se pudo leer el usuario");
  const { data: secrets, error: secretError } = await dataApi
    .from("user_secrets")
    .select("*")
    .eq("user_id", userId);
  throwIfApiError(secretError, "No se pudo leer el secreto de sesión");
  return toAppUser(user, secrets?.[0] || null);
}

async function verifyUserSession(userId: string, sessionSecret: string) {
  const { data: secrets, error } = await dataApi.from("user_secrets").select("*").eq("user_id", userId);
  throwIfApiError(error, "No se pudo comprobar la sesión");
  const secret = secrets?.[0];
  const stored = secret?.session_secret || secret?.sessionSecret;
  return !!secret && stored === sessionSecret;
}

function rpcPayload(data: unknown): { success?: boolean; target_id?: string; balance?: number | string; noop?: boolean } {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as { success?: boolean; target_id?: string; balance?: number | string; noop?: boolean };
  }
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return {};
}

function numericBalance(value: number | string | undefined) {
  const n = parseFloat(String(value ?? 0));
  return Number.isFinite(n) ? n : 0;
}

async function findUserByAuthId(authUserId: string) {
  const { data, error } = await dataApi.from("users").select("*").eq("auth_user_id", authUserId);
  throwIfApiError(error, "No se pudo buscar el usuario");
  return data?.[0] || null;
}

async function createRegisteredUserRow(authUserId: string, displayName: string): Promise<AppUserPayload> {
  const { data: newUser, error: userError } = await dataApi
    .from("users")
    .insert({ display_name: displayName, auth_user_id: authUserId })
    .select()
    .single();
  throwIfApiError(userError, "No se pudo crear el usuario");

  const { data: newSecret, error: secretError } = await dataApi
    .from("user_secrets")
    .insert({ user_id: newUser.id })
    .select()
    .single();
  throwIfApiError(secretError, "No se pudo crear el secreto de sesión");

  return toAppUser(newUser, newSecret);
}

export async function completeAuthAction(params: {
  authToken: string;
  displayName?: string;
  ghost?: { id: string; session_secret: string };
}) {
  try {
    const session = await verifyNeonSession(params.authToken);
    const desiredName = params.displayName?.trim().slice(0, 60);

    if (params.ghost) {
      const { data: secrets, error: secretError } = await dataApi
        .from("user_secrets")
        .select("*")
        .eq("user_id", params.ghost.id);
      throwIfApiError(secretError, "No se pudo comprobar la sesión de invitado");
      const secret = secrets?.[0];
      const storedSecret = secret?.session_secret || secret?.sessionSecret;
      if (!secret || storedSecret !== params.ghost.session_secret) {
        return { success: false, error: "Sesión de invitado inválida" };
      }

      const { data: ghost, error: ghostError } = await dataApi
        .from("users")
        .select("*")
        .eq("id", params.ghost.id)
        .single();
      throwIfApiError(ghostError, "No se pudo leer el usuario invitado");
      if (!(ghost.is_ghost ?? ghost.isGhost)) {
        return { success: false, error: "Este usuario ya tiene una cuenta" };
      }

      const existing = await findUserByAuthId(session.authUserId);
      if (!existing) {
        const { error: updateError } = await dataApi
          .from("users")
          .update({
            auth_user_id: session.authUserId,
            display_name: desiredName || ghost.display_name || ghost.displayName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", params.ghost.id);
        throwIfApiError(updateError, "No se pudo vincular la cuenta");
        return { success: true, user: await loadUserWithSecret(params.ghost.id) };
      }

      if (existing.id === params.ghost.id) {
        return { success: true, user: await loadUserWithSecret(params.ghost.id) };
      }

      const { error: mergeError } = await dataApi.rpc("merge_ghost_into_user", {
        p_ghost_id: params.ghost.id,
        p_target_id: existing.id,
      });
      throwIfApiError(mergeError, "No se pudieron transferir las cuentas");
      return { success: true, user: await loadUserWithSecret(existing.id) };
    }

    const existing = await findUserByAuthId(session.authUserId);
    if (existing) {
      return { success: true, user: await loadUserWithSecret(existing.id) };
    }

    const displayName = desiredName || fallbackDisplayName(session.name, session.email);
    return { success: true, user: await createRegisteredUserRow(session.authUserId, displayName) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

async function touchAccount(accountId: string) {
  const { error } = await dataApi
    .from("accounts")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", accountId);
  throwIfApiError(error, "No se pudo actualizar la cuenta");
}

async function touchAccountsForUser(userId: string) {
  const { data: members, error } = await dataApi
    .from("account_members")
    .select("account_id")
    .eq("user_id", userId);
  throwIfApiError(error, "No se pudieron leer las cuentas del usuario");
  const ids = [...new Set((members || []).map((m: { account_id: string }) => m.account_id))];
  await Promise.all(ids.map((id) => touchAccount(id)));
}

type DashboardAccountRow = {
  id: string;
  name: string;
  currency: string;
  icon_key?: string;
  iconKey?: string;
  updated_at?: string;
  updatedAt?: string;
};

function mapDashboardAccount(a: DashboardAccountRow) {
  return {
    id: a.id,
    name: a.name,
    currency: a.currency,
    icon_key: a.icon_key || a.iconKey,
    updated_at: a.updated_at || a.updatedAt || null,
  };
}

function mapBalanceMap(
  bals: { account_id?: string; accountId?: string; balance: string | number }[] | null
) {
  const balanceMap: Record<string, number> = {};
  (bals || []).forEach((b) => {
    const key = b.account_id || b.accountId;
    if (key) balanceMap[key] = parseFloat(String(b.balance));
  });
  return balanceMap;
}

async function applyBalanceDeltas(
  accountId: string,
  deltas: { userId: string; delta: number }[],
  existingBals: { user_id?: string; userId?: string; balance: string | number }[]
) {
  const balByUser = new Map(existingBals.map((b) => [userIdOf(b), b]));
  const now = new Date().toISOString();

  await Promise.all(
    deltas.map(async ({ userId, delta }) => {
      const currBal = balByUser.get(userId);
      if (currBal) {
        const newBalance = parseFloat(String(currBal.balance)) + delta;
        const { error } = await dataApi
          .from("account_balances")
          .update({ balance: newBalance.toString(), updated_at: now })
          .eq("account_id", accountId)
          .eq("user_id", userId);
        throwIfApiError(error, "No se pudo actualizar el saldo");
      } else {
        const { error } = await dataApi.from("account_balances").insert({
          account_id: accountId,
          user_id: userId,
          balance: delta.toString(),
          updated_at: now,
        });
        throwIfApiError(error, "No se pudo crear el saldo");
      }
    })
  );

  await touchAccount(accountId);
}

export async function createGhostUser(displayName: string) {
  try {
    const { data: newUser, error: userError } = await dataApi
      .from("users")
      .insert({ display_name: displayName })
      .select()
      .single();
    throwIfApiError(userError, "No se pudo crear el usuario");

    const { data: newSecret, error: secretError } = await dataApi
      .from("user_secrets")
      .insert({ user_id: newUser.id })
      .select()
      .single();
    throwIfApiError(secretError, "No se pudo crear el secreto de sesión");

    return {
      success: true,
      user: {
        id: newUser.id,
        display_name: newUser.display_name,
        is_ghost: !!newUser.is_ghost,
        session_secret: newSecret.session_secret,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getDashboardData(userId: string) {
  try {
    const { data: members, error: membersError } = await dataApi
      .from("account_members")
      .select("account_id")
      .eq("user_id", userId);
    throwIfApiError(membersError, "No se pudieron leer las cuentas del usuario");

    const accountIds = (members || []).map((m: { account_id: string }) => m.account_id);

    if (accountIds.length === 0) {
      return { success: true, accounts: [], balances: {} };
    }

    const [accsRes, balsRes] = await Promise.all([
      dataApi.from("accounts").select("id, name, icon_key, currency, updated_at").in("id", accountIds),
      dataApi.from("account_balances").select("account_id, balance").eq("user_id", userId).in("account_id", accountIds),
    ]);
    throwIfApiError(accsRes.error, "No se pudieron leer las cuentas");
    throwIfApiError(balsRes.error, "No se pudieron leer los saldos");

    return {
      success: true,
      accounts: (accsRes.data || []).map(mapDashboardAccount),
      balances: mapBalanceMap(balsRes.data),
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAccountsMeta(accountIds: string[]) {
  try {
    if (accountIds.length === 0) {
      return { success: true, accounts: [] as ReturnType<typeof mapDashboardAccount>[] };
    }
    const { data, error } = await dataApi
      .from("accounts")
      .select("id, name, icon_key, currency, updated_at")
      .in("id", accountIds);
    throwIfApiError(error, "No se pudieron leer las cuentas");
    return { success: true, accounts: (data || []).map(mapDashboardAccount) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getDashboardBalances(userId: string, accountIds: string[]) {
  try {
    if (accountIds.length === 0) {
      return { success: true, balances: {} as Record<string, number> };
    }
    const { data, error } = await dataApi
      .from("account_balances")
      .select("account_id, balance")
      .eq("user_id", userId)
      .in("account_id", accountIds);
    throwIfApiError(error, "No se pudieron leer los saldos");
    return { success: true, balances: mapBalanceMap(data) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAccountMeta(accountId: string) {
  try {
    const { data, error } = await dataApi
      .from("accounts")
      .select("id, name, icon_key, currency, updated_at")
      .eq("id", accountId)
      .single();
    if (error || !data) return { success: false, error: "Not found" };
    return { success: true, account: mapDashboardAccount(data) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAccountAction(accountId: string) {
  try {
    // account_id is denormalized and historically ON DELETE RESTRICT, so
    // entries must go before the account. transactions/members/balances cascade.
    const { error: entriesError } = await dataApi
      .from("transaction_entries")
      .delete()
      .eq("account_id", accountId);
    throwIfApiError(entriesError, "No se pudieron eliminar los apuntes");

    const { error } = await dataApi.from("accounts").delete().eq("id", accountId);
    throwIfApiError(error, "No se pudo eliminar la cuenta");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAccountData(accountId: string) {
  try {
    const { data: account, error: accountError } = await dataApi
      .from("accounts")
      .select("*")
      .eq("id", accountId)
      .single();
    if (accountError || !account) return { success: false, error: "Not found" };

    const [membersRes, balancesRes, txsRes] = await Promise.all([
      dataApi.from("account_members").select("*").eq("account_id", accountId),
      dataApi.from("account_balances").select("*").eq("account_id", accountId),
      dataApi.from("transactions").select("*").eq("account_id", accountId),
    ]);
    throwIfApiError(membersRes.error, "No se pudieron leer los miembros");
    throwIfApiError(balancesRes.error, "No se pudieron leer los saldos");
    throwIfApiError(txsRes.error, "No se pudieron leer las transacciones");

    const members = membersRes.data || [];
    const balances = balancesRes.data || [];
    const txs = (txsRes.data || []).filter((t: { deleted_at?: string | null; deletedAt?: string | null }) =>
      !(t.deleted_at ?? t.deletedAt)
    );

    const userIds = members.map((m: { user_id: string }) => m.user_id);
    const txIds = txs.map((t: { id: string }) => t.id);

    const [usersRes, entriesRes] = await Promise.all([
      userIds.length > 0
        ? dataApi.from("users").select("*").in("id", userIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      txIds.length > 0
        ? dataApi.from("transaction_entries").select("*").in("transaction_id", txIds)
        : Promise.resolve({ data: [] as any[], error: null }),
    ]);
    throwIfApiError(usersRes.error, "No se pudieron leer los usuarios");
    throwIfApiError(entriesRes.error, "No se pudieron leer los apuntes");

    return {
      success: true,
      account,
      users: usersRes.data || [],
      members,
      balances,
      transactions: txs,
      entries: entriesRes.data || [],
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

function normalizeAccountDetails(name: string, iconKey: string, currency: string) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "El nombre es obligatorio" };
  if (!isAccountCurrency(currency)) return { error: "Moneda no válida" };
  if (!isAccountIcon(iconKey)) return { error: "Icono no válido" };
  return { name: trimmed, iconKey, currency };
}

export async function createAccountAction(userId: string, name: string, iconKey: string, currency: string) {
  try {
    const parsed = normalizeAccountDetails(name, iconKey, currency);
    if ("error" in parsed) return { success: false, error: parsed.error };

    const { data: newAccount, error: accountError } = await dataApi
      .from("accounts")
      .insert({
        name: parsed.name,
        icon_key: parsed.iconKey,
        currency: parsed.currency,
        created_by: userId,
      })
      .select()
      .single();
    throwIfApiError(accountError, "No se pudo crear la cuenta");

    const { error: memberError } = await dataApi.from("account_members").insert({
      account_id: newAccount.id,
      user_id: userId,
      role: "owner",
    });
    throwIfApiError(memberError, "No se pudo añadir el miembro");

    const { error: balanceError } = await dataApi.from("account_balances").insert({
      account_id: newAccount.id,
      user_id: userId,
      balance: "0",
    });
    throwIfApiError(balanceError, "No se pudo crear el saldo");

    return { success: true, accountId: newAccount.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateAccountAction(accountId: string, name: string, iconKey: string, currency: string) {
  try {
    const parsed = normalizeAccountDetails(name, iconKey, currency);
    if ("error" in parsed) return { success: false, error: parsed.error };

    const updatedAt = new Date().toISOString();
    const { data, error } = await dataApi
      .from("accounts")
      .update({
        name: parsed.name,
        icon_key: parsed.iconKey,
        currency: parsed.currency,
        updated_at: updatedAt,
      })
      .eq("id", accountId)
      .select("id, updated_at")
      .single();
    throwIfApiError(error, "No se pudo actualizar la cuenta");

    return {
      success: true,
      updatedAt: (data as { updated_at?: string; updatedAt?: string } | null)?.updated_at
        || (data as { updatedAt?: string } | null)?.updatedAt
        || updatedAt,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export type AccountPreviewUser = {
  id: string;
  display_name: string;
  is_ghost: boolean;
};

export async function getAccountPreviewAction(token: string) {
  try {
    const { data: account, error: accountError } = await dataApi
      .from("accounts")
      .select("id, name, icon_key, currency")
      .eq("invite_token", token)
      .single();
    if (accountError || !account) return { success: false, error: "Not found" };

    const { data: mems, error: memsError } = await dataApi
      .from("account_members")
      .select("user_id")
      .eq("account_id", account.id);
    throwIfApiError(memsError, "No se pudieron leer los miembros");

    const userIds = (mems || []).map((m: { user_id: string }) => m.user_id);
    let accountUsers: AccountPreviewUser[] = [];
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await dataApi
        .from("users")
        .select("id, display_name, is_ghost")
        .in("id", userIds);
      throwIfApiError(usersError, "No se pudieron leer los usuarios");
      accountUsers = (users || []).map(
        (u: { id: string; display_name?: string; displayName?: string; is_ghost?: boolean; isGhost?: boolean }) => ({
          id: u.id,
          display_name: u.display_name || u.displayName || "",
          is_ghost: !!(u.is_ghost ?? u.isGhost),
        })
      );
    }

    return { success: true, account, users: accountUsers };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function joinAccountAction(token: string, userId: string, sessionSecret: string) {
  try {
    if (!sessionSecret || !(await verifyUserSession(userId, sessionSecret))) {
      return { success: false, error: "Sesión inválida" };
    }

    const { data: account, error: accountError } = await dataApi
      .from("accounts")
      .select("id")
      .eq("invite_token", token)
      .single();
    if (accountError || !account) return { success: false, error: "Not found" };

    const { data: existingMember, error: existingError } = await dataApi
      .from("account_members")
      .select("id")
      .eq("account_id", account.id)
      .eq("user_id", userId);
    throwIfApiError(existingError, "No se pudo comprobar la membresía");

    if (!existingMember || existingMember.length === 0) {
      const { error: memberError } = await dataApi.from("account_members").insert({
        account_id: account.id,
        user_id: userId,
        role: "member",
      });
      throwIfApiError(memberError, "No se pudo unir a la cuenta");

      const { error: balanceError } = await dataApi.from("account_balances").insert({
        account_id: account.id,
        user_id: userId,
        balance: "0",
      });
      throwIfApiError(balanceError, "No se pudo crear el saldo");
      await touchAccount(account.id);
    }

    return { success: true, accountId: account.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function claimParticipantAction(params: {
  token: string;
  sourceUserId: string;
  target?: { id: string; session_secret: string };
}) {
  try {
    const { data: account, error: accountError } = await dataApi
      .from("accounts")
      .select("id")
      .eq("invite_token", params.token)
      .single();
    if (accountError || !account) return { success: false, error: "Not found" };

    const { data: source, error: sourceError } = await dataApi
      .from("users")
      .select("id, display_name, is_ghost")
      .eq("id", params.sourceUserId)
      .single();
    if (sourceError || !source) {
      return { success: false, error: "Este participante ya fue reclamado" };
    }
    const sourceRow = source as {
      id: string;
      display_name?: string;
      displayName?: string;
      is_ghost?: boolean;
      isGhost?: boolean;
    };
    const sourceName = sourceRow.display_name || sourceRow.displayName || "Usuario";
    if (!(sourceRow.is_ghost ?? sourceRow.isGhost)) {
      return { success: false, error: "El usuario origen no es un invitado" };
    }

    const { data: sourceMember, error: sourceMemberError } = await dataApi
      .from("account_members")
      .select("id")
      .eq("account_id", account.id)
      .eq("user_id", params.sourceUserId);
    throwIfApiError(sourceMemberError, "No se pudo comprobar la membresía");
    if (!sourceMember || sourceMember.length === 0) {
      return { success: false, error: "Este participante ya fue reclamado" };
    }

    let targetUser: AppUserPayload;
    if (params.target) {
      if (!(await verifyUserSession(params.target.id, params.target.session_secret))) {
        return { success: false, error: "Sesión inválida" };
      }
      targetUser = await loadUserWithSecret(params.target.id);
    } else {
      const created = await createGhostUser(sourceName);
      if (!created.success || !created.user) {
        return { success: false, error: created.error || "No se pudo crear el usuario" };
      }
      targetUser = await loadUserWithSecret(created.user.id);
    }

    const { data: rpcData, error: rpcError } = await dataApi.rpc("claim_participant_in_account", {
      p_account_id: account.id,
      p_source_id: params.sourceUserId,
      p_target_id: targetUser.id,
    });
    throwIfApiError(rpcError, "No se pudo reclamar al participante");

    const payload = rpcPayload(rpcData);
    return {
      success: true,
      accountId: account.id,
      balance: numericBalance(payload.balance),
      user: targetUser,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addParticipantAction(accountId: string, displayName: string) {
  try {
    const name = displayName.trim();
    if (!name) {
      return { success: false, error: "El nombre es obligatorio" };
    }

    const { data: account, error: accountError } = await dataApi
      .from("accounts")
      .select("id")
      .eq("id", accountId)
      .single();
    if (accountError || !account) return { success: false, error: "Cuenta no encontrada" };

    const { data: newUser, error: userError } = await dataApi
      .from("users")
      .insert({ display_name: name })
      .select()
      .single();
    throwIfApiError(userError, "No se pudo crear el participante");

    const { error: memberError } = await dataApi.from("account_members").insert({
      account_id: accountId,
      user_id: newUser.id,
      role: "member",
    });
    throwIfApiError(memberError, "No se pudo añadir el miembro");

    const { error: balanceError } = await dataApi.from("account_balances").insert({
      account_id: accountId,
      user_id: newUser.id,
      balance: "0",
    });
    throwIfApiError(balanceError, "No se pudo crear el saldo");

    await touchAccount(accountId);
    return { success: true, user: newUser };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateParticipantNameAction(accountId: string, userId: string, displayName: string) {
  try {
    const name = displayName.trim();
    if (!name) {
      return { success: false, error: "El nombre es obligatorio" };
    }
    if (name.length > 60) {
      return { success: false, error: "El nombre no puede superar 60 caracteres" };
    }

    const { data: members, error: memberError } = await dataApi
      .from("account_members")
      .select("id")
      .eq("account_id", accountId)
      .eq("user_id", userId);
    throwIfApiError(memberError, "No se pudo comprobar la membresía");
    if (!members || members.length === 0) {
      return { success: false, error: "El participante no está en esta cuenta" };
    }

    const { error: updateError } = await dataApi
      .from("users")
      .update({ display_name: name, updated_at: new Date().toISOString() })
      .eq("id", userId);
    throwIfApiError(updateError, "No se pudo actualizar el nombre");

    await touchAccount(accountId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateUserNameAction(userId: string, displayName: string) {
  try {
    const name = displayName.trim();
    if (!name) {
      return { success: false, error: "El nombre es obligatorio" };
    }
    if (name.length > 60) {
      return { success: false, error: "El nombre no puede superar 60 caracteres" };
    }

    const { error: updateError } = await dataApi
      .from("users")
      .update({ display_name: name, updated_at: new Date().toISOString() })
      .eq("id", userId);
    throwIfApiError(updateError, "No se pudo actualizar el nombre");

    await touchAccountsForUser(userId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function removeParticipantAction(accountId: string, userId: string) {
  try {
    const { data: members, error: memberError } = await dataApi
      .from("account_members")
      .select("*")
      .eq("account_id", accountId)
      .eq("user_id", userId);
    throwIfApiError(memberError, "No se pudo comprobar la membresía");

    const member = members?.[0];
    if (!member) {
      return { success: false, error: "El participante no está en esta cuenta" };
    }
    if (member.role === "owner") {
      return { success: false, error: "No se puede eliminar al creador de la cuenta" };
    }

    const { data: entries, error: entriesError } = await dataApi
      .from("transaction_entries")
      .select("id")
      .eq("account_id", accountId)
      .eq("user_id", userId)
      .limit(1);
    throwIfApiError(entriesError, "No se pudieron leer los gastos");
    if (entries && entries.length > 0) {
      return {
        success: false,
        error: "No se puede eliminar porque ya participa en gastos. Quita esos gastos primero.",
      };
    }

    const { error: balanceError } = await dataApi
      .from("account_balances")
      .delete()
      .eq("account_id", accountId)
      .eq("user_id", userId);
    throwIfApiError(balanceError, "No se pudo eliminar el saldo");

    const { error: deleteMemberError } = await dataApi
      .from("account_members")
      .delete()
      .eq("account_id", accountId)
      .eq("user_id", userId);
    throwIfApiError(deleteMemberError, "No se pudo eliminar el miembro");

    await touchAccount(accountId);

    const { data: user, error: userError } = await dataApi
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    throwIfApiError(userError, "No se pudo leer el usuario");

    const isGhost = !!(user?.is_ghost ?? user?.isGhost);
    if (isGhost) {
      const { data: otherMembers, error: otherError } = await dataApi
        .from("account_members")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
      throwIfApiError(otherError, "No se pudieron leer las cuentas del usuario");
      if (!otherMembers || otherMembers.length === 0) {
        await dataApi.from("users").delete().eq("id", userId);
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addTransactionAction(
  accountId: string,
  description: string,
  amount: number,
  splits: { userId: string; paid: number; owed: number }[],
  createdBy?: string
) {
  try {
    const { data: account, error: accountError } = await dataApi
      .from("accounts")
      .select("currency")
      .eq("id", accountId)
      .single();
    throwIfApiError(accountError, "No se pudo leer la cuenta");

    const { data: newTx, error: txError } = await dataApi
      .from("transactions")
      .insert({
        account_id: accountId,
        description,
        total_amount: amount.toString(),
        currency: account?.currency || "EUR",
        created_by: createdBy || splits[0]?.userId,
        type: "expense",
      })
      .select()
      .single();
    throwIfApiError(txError, "No se pudo crear la transacción");

    const { data: currBals, error: currBalError } = await dataApi
      .from("account_balances")
      .select("*")
      .eq("account_id", accountId);
    throwIfApiError(currBalError, "No se pudo leer el saldo");

    let entries: unknown[] = [];
    if (splits.length > 0) {
      const { data: inserted, error: entriesError } = await dataApi
        .from("transaction_entries")
        .insert(
          splits.map((split) => ({
            transaction_id: newTx.id,
            account_id: accountId,
            user_id: split.userId,
            paid_amount: split.paid.toString(),
            owed_amount: split.owed.toString(),
          }))
        )
        .select();
      throwIfApiError(entriesError, "No se pudo crear el apunte");
      entries = inserted || [];
    }

    await applyBalanceDeltas(
      accountId,
      splits.map((split) => ({ userId: split.userId, delta: split.paid - split.owed })),
      currBals || []
    );

    return { success: true, transaction: newTx, entries };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateTransactionAction(
  accountId: string,
  transactionId: string,
  description: string,
  amount: number,
  splits: { userId: string; paid: number; owed: number }[]
) {
  try {
    const { data: tx, error: txError } = await dataApi
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("account_id", accountId)
      .single();
    if (txError || !tx) return { success: false, error: "Gasto no encontrado" };
    if (tx.deleted_at ?? tx.deletedAt) return { success: false, error: "Este gasto ya no existe" };

    const [oldEntriesRes, balsRes] = await Promise.all([
      dataApi.from("transaction_entries").select("*").eq("transaction_id", transactionId),
      dataApi.from("account_balances").select("*").eq("account_id", accountId),
    ]);
    throwIfApiError(oldEntriesRes.error, "No se pudieron leer los apuntes");
    throwIfApiError(balsRes.error, "No se pudo leer el saldo");

    const originalBals = balsRes.data || [];
    const workingBals = originalBals.map((b: any) => ({ ...b }));
    const touched = new Set<string>();

    for (const entry of oldEntriesRes.data || []) {
      const userId = entry.user_id || entry.userId;
      const paid = parseFloat(String(entry.paid_amount ?? entry.paidAmount ?? 0));
      const owed = parseFloat(String(entry.owed_amount ?? entry.owedAmount ?? 0));
      const oldNet = parseFloat(String(entry.net_amount ?? entry.netAmount ?? paid - owed));
      const currBal = workingBals.find((b: any) => (b.user_id || b.userId) === userId);
      if (currBal) {
        currBal.balance = parseFloat(String(currBal.balance)) - oldNet;
        touched.add(userId);
      }
    }

    for (const split of splits) {
      const delta = split.paid - split.owed;
      const currBal = workingBals.find((b: any) => (b.user_id || b.userId) === split.userId);
      if (currBal) {
        currBal.balance = parseFloat(String(currBal.balance)) + delta;
      } else {
        workingBals.push({ user_id: split.userId, balance: delta });
      }
      touched.add(split.userId);
    }

    const [deleteEntriesRes, updateTxRes] = await Promise.all([
      dataApi.from("transaction_entries").delete().eq("transaction_id", transactionId),
      dataApi.from("transactions").update({
        description,
        total_amount: amount.toString(),
      }).eq("id", transactionId).eq("account_id", accountId),
    ]);
    throwIfApiError(deleteEntriesRes.error, "No se pudieron eliminar los apuntes");
    throwIfApiError(updateTxRes.error, "No se pudo actualizar el gasto");

    if (splits.length > 0) {
      const { error: entriesError } = await dataApi.from("transaction_entries").insert(
        splits.map((split) => ({
          transaction_id: transactionId,
          account_id: accountId,
          user_id: split.userId,
          paid_amount: split.paid.toString(),
          owed_amount: split.owed.toString(),
        }))
      );
      throwIfApiError(entriesError, "No se pudo crear el apunte");
    }

    await applyBalanceDeltas(
      accountId,
      [...touched].map((userId) => {
        const finalBal = workingBals.find((b: any) => (b.user_id || b.userId) === userId);
        const original = originalBals.find((b: any) => (b.user_id || b.userId) === userId);
        const finalValue = parseFloat(String(finalBal?.balance ?? 0));
        const originalValue = original ? parseFloat(String(original.balance)) : 0;
        return { userId, delta: finalValue - originalValue };
      }),
      originalBals
    );

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteTransactionAction(accountId: string, transactionId: string) {
  try {
    const { data: tx, error: txError } = await dataApi
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("account_id", accountId)
      .single();
    if (txError || !tx) return { success: false, error: "Gasto no encontrado" };
    if (tx.deleted_at ?? tx.deletedAt) return { success: true };

    const [entriesRes, balsRes] = await Promise.all([
      dataApi.from("transaction_entries").select("*").eq("transaction_id", transactionId),
      dataApi.from("account_balances").select("*").eq("account_id", accountId),
    ]);
    throwIfApiError(entriesRes.error, "No se pudieron leer los apuntes");
    throwIfApiError(balsRes.error, "No se pudo leer el saldo");

    const entries = entriesRes.data || [];
    const originalBals = balsRes.data || [];
    const deltas = entries.map((entry: {
      user_id?: string;
      userId?: string;
      paid_amount?: string | number;
      paidAmount?: string | number;
      owed_amount?: string | number;
      owedAmount?: string | number;
      net_amount?: string | number;
      netAmount?: string | number;
    }) => {
      const userId = entry.user_id || entry.userId || "";
      const paid = parseFloat(String(entry.paid_amount ?? entry.paidAmount ?? 0));
      const owed = parseFloat(String(entry.owed_amount ?? entry.owedAmount ?? 0));
      const oldNet = parseFloat(String(entry.net_amount ?? entry.netAmount ?? paid - owed));
      return { userId, delta: -oldNet };
    }).filter((d: { userId: string }) => d.userId);

    const [deleteEntriesRes, deleteTxRes] = await Promise.all([
      dataApi.from("transaction_entries").delete().eq("transaction_id", transactionId),
      dataApi.from("transactions").update({
        deleted_at: new Date().toISOString(),
      }).eq("id", transactionId).eq("account_id", accountId),
    ]);
    throwIfApiError(deleteEntriesRes.error, "No se pudieron eliminar los apuntes");
    throwIfApiError(deleteTxRes.error, "No se pudo eliminar el gasto");

    if (deltas.length > 0) {
      await applyBalanceDeltas(accountId, deltas, originalBals);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
