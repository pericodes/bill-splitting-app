"use server"

import { dataApi, throwIfApiError } from "@/data/dataApi";

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

    const { data: accs, error: accsError } = await dataApi
      .from("accounts")
      .select("*")
      .in("id", accountIds);
    throwIfApiError(accsError, "No se pudieron leer las cuentas");

    const { data: bals, error: balsError } = await dataApi
      .from("account_balances")
      .select("*")
      .eq("user_id", userId)
      .in("account_id", accountIds);
    throwIfApiError(balsError, "No se pudieron leer los saldos");

    const balanceMap: Record<string, number> = {};
    (bals || []).forEach((b: { account_id: string; accountId?: string; balance: string | number }) => {
      balanceMap[b.account_id || b.accountId] = parseFloat(String(b.balance));
    });

    return { success: true, accounts: accs || [], balances: balanceMap };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAccountAction(accountId: string) {
  try {
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

    const { data: members, error: membersError } = await dataApi
      .from("account_members")
      .select("*")
      .eq("account_id", accountId);
    throwIfApiError(membersError, "No se pudieron leer los miembros");

    const userIds = (members || []).map((m: { user_id: string }) => m.user_id);
    let accountUsers: any[] = [];
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await dataApi
        .from("users")
        .select("*")
        .in("id", userIds);
      throwIfApiError(usersError, "No se pudieron leer los usuarios");
      accountUsers = users || [];
    }

    const { data: balances, error: balancesError } = await dataApi
      .from("account_balances")
      .select("*")
      .eq("account_id", accountId);
    throwIfApiError(balancesError, "No se pudieron leer los saldos");

    const { data: txs, error: txsError } = await dataApi
      .from("transactions")
      .select("*")
      .eq("account_id", accountId);
    throwIfApiError(txsError, "No se pudieron leer las transacciones");

    const txIds = (txs || []).map((t: { id: string }) => t.id);
    let ents: any[] = [];
    if (txIds.length > 0) {
      const { data: entries, error: entriesError } = await dataApi
        .from("transaction_entries")
        .select("*")
        .in("transaction_id", txIds);
      throwIfApiError(entriesError, "No se pudieron leer los apuntes");
      ents = entries || [];
    }

    return {
      success: true,
      account,
      users: accountUsers,
      members: members || [],
      balances: balances || [],
      transactions: txs || [],
      entries: ents,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createAccountAction(userId: string, name: string, iconKey: string, currency: string) {
  try {
    const { data: newAccount, error: accountError } = await dataApi
      .from("accounts")
      .insert({
        name,
        icon_key: iconKey,
        currency,
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

export async function getAccountPreviewAction(token: string) {
  try {
    const { data: account, error: accountError } = await dataApi
      .from("accounts")
      .select("*")
      .eq("invite_token", token)
      .single();
    if (accountError || !account) return { success: false, error: "Not found" };

    const { data: mems, error: memsError } = await dataApi
      .from("account_members")
      .select("*")
      .eq("account_id", account.id);
    throwIfApiError(memsError, "No se pudieron leer los miembros");

    const userIds = (mems || []).map((m: { user_id: string }) => m.user_id);
    let accountUsers: any[] = [];
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await dataApi
        .from("users")
        .select("*")
        .in("id", userIds);
      throwIfApiError(usersError, "No se pudieron leer los usuarios");
      accountUsers = users || [];
    }

    return { success: true, account, users: accountUsers };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function joinAccountAction(token: string, userId: string) {
  try {
    const { data: account, error: accountError } = await dataApi
      .from("accounts")
      .select("*")
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
    }

    return { success: true, accountId: account.id };
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
  splits: { userId: string; paid: number; owed: number }[]
) {
  try {
    const { data: newTx, error: txError } = await dataApi
      .from("transactions")
      .insert({
        account_id: accountId,
        description,
        total_amount: amount.toString(),
        currency: "EUR",
        created_by: splits[0].userId,
        type: "expense",
      })
      .select()
      .single();
    throwIfApiError(txError, "No se pudo crear la transacción");

    for (const split of splits) {
      const netAmount = split.paid - split.owed;
      const { error: entryError } = await dataApi.from("transaction_entries").insert({
        transaction_id: newTx.id,
        account_id: accountId,
        user_id: split.userId,
        paid_amount: split.paid.toString(),
        owed_amount: split.owed.toString(),
      });
      throwIfApiError(entryError, "No se pudo crear el apunte");

      const { data: currBals, error: currBalError } = await dataApi
        .from("account_balances")
        .select("*")
        .eq("account_id", accountId)
        .eq("user_id", split.userId)
        .limit(1);
      throwIfApiError(currBalError, "No se pudo leer el saldo");

      const currBal = currBals?.[0];
      if (currBal) {
        const newBalance = parseFloat(String(currBal.balance)) + netAmount;
        const { error: updateError } = await dataApi
          .from("account_balances")
          .update({ balance: newBalance.toString() })
          .eq("account_id", accountId)
          .eq("user_id", split.userId);
        throwIfApiError(updateError, "No se pudo actualizar el saldo");
      } else {
        const { error: insertBalError } = await dataApi.from("account_balances").insert({
          account_id: accountId,
          user_id: split.userId,
          balance: netAmount.toString(),
        });
        throwIfApiError(insertBalError, "No se pudo crear el saldo");
      }
    }

    return { success: true };
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

    const { data: oldEntries, error: oldError } = await dataApi
      .from("transaction_entries")
      .select("*")
      .eq("transaction_id", transactionId);
    throwIfApiError(oldError, "No se pudieron leer los apuntes");

    for (const entry of oldEntries || []) {
      const userId = entry.user_id || entry.userId;
      const paid = parseFloat(String(entry.paid_amount ?? entry.paidAmount ?? 0));
      const owed = parseFloat(String(entry.owed_amount ?? entry.owedAmount ?? 0));
      const oldNet = parseFloat(String(entry.net_amount ?? entry.netAmount ?? paid - owed));

      const { data: currBals, error: currBalError } = await dataApi
        .from("account_balances")
        .select("*")
        .eq("account_id", accountId)
        .eq("user_id", userId)
        .limit(1);
      throwIfApiError(currBalError, "No se pudo leer el saldo");

      const currBal = currBals?.[0];
      if (currBal) {
        const newBalance = parseFloat(String(currBal.balance)) - oldNet;
        const { error: updateError } = await dataApi
          .from("account_balances")
          .update({ balance: newBalance.toString() })
          .eq("account_id", accountId)
          .eq("user_id", userId);
        throwIfApiError(updateError, "No se pudo revertir el saldo");
      }
    }

    const { error: deleteEntriesError } = await dataApi
      .from("transaction_entries")
      .delete()
      .eq("transaction_id", transactionId);
    throwIfApiError(deleteEntriesError, "No se pudieron eliminar los apuntes");

    const { error: updateTxError } = await dataApi
      .from("transactions")
      .update({
        description,
        total_amount: amount.toString(),
      })
      .eq("id", transactionId)
      .eq("account_id", accountId);
    throwIfApiError(updateTxError, "No se pudo actualizar el gasto");

    for (const split of splits) {
      const netAmount = split.paid - split.owed;
      const { error: entryError } = await dataApi.from("transaction_entries").insert({
        transaction_id: transactionId,
        account_id: accountId,
        user_id: split.userId,
        paid_amount: split.paid.toString(),
        owed_amount: split.owed.toString(),
      });
      throwIfApiError(entryError, "No se pudo crear el apunte");

      const { data: currBals, error: currBalError } = await dataApi
        .from("account_balances")
        .select("*")
        .eq("account_id", accountId)
        .eq("user_id", split.userId)
        .limit(1);
      throwIfApiError(currBalError, "No se pudo leer el saldo");

      const currBal = currBals?.[0];
      if (currBal) {
        const newBalance = parseFloat(String(currBal.balance)) + netAmount;
        const { error: updateError } = await dataApi
          .from("account_balances")
          .update({ balance: newBalance.toString() })
          .eq("account_id", accountId)
          .eq("user_id", split.userId);
        throwIfApiError(updateError, "No se pudo actualizar el saldo");
      } else {
        const { error: insertBalError } = await dataApi.from("account_balances").insert({
          account_id: accountId,
          user_id: split.userId,
          balance: netAmount.toString(),
        });
        throwIfApiError(insertBalError, "No se pudo crear el saldo");
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
