"use server"

import { db } from "@/data/db";
import { users, userSecrets, accounts, accountMembers, accountBalances, transactions, transactionEntries } from "@/data/schema";
import { eq, inArray, and } from "drizzle-orm";

export async function createGhostUser(displayName: string) {
  try {
    const [newUser] = await db.insert(users).values({
      displayName,
      authUserId: null
    }).returning();

    const [newSecret] = await db.insert(userSecrets).values({
      userId: newUser.id,
    }).returning();

    return { 
      success: true, 
      user: {
        id: newUser.id,
        display_name: newUser.displayName,
        is_ghost: !!newUser.isGhost,
        session_secret: newSecret.sessionSecret
      } 
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getDashboardData(userId: string) {
  try {
    const members = await db.select({ accountId: accountMembers.accountId }).from(accountMembers).where(eq(accountMembers.userId, userId));
    const accountIds = members.map(m => m.accountId);
    
    if (accountIds.length === 0) {
      return { success: true, accounts: [], balances: {} };
    }
    
    const accs = await db.select().from(accounts).where(inArray(accounts.id, accountIds));
    const bals = await db.select().from(accountBalances).where(
      and(
        eq(accountBalances.userId, userId),
        inArray(accountBalances.accountId, accountIds)
      )
    );
    
    const balanceMap: Record<string, number> = {};
    bals.forEach(b => {
      balanceMap[b.accountId] = parseFloat(b.balance);
    });
    
    return { success: true, accounts: accs, balances: balanceMap };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAccountAction(accountId: string) {
  try {
    await db.delete(accounts).where(eq(accounts.id, accountId));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAccountData(accountId: string) {
  try {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
    if (!account) return { success: false, error: "Not found" };
    
    // get users in account
    const members = await db.select().from(accountMembers).where(eq(accountMembers.accountId, accountId));
    const userIds = members.map(m => m.userId);
    const accountUsers = userIds.length > 0 
      ? await db.select().from(users).where(inArray(users.id, userIds))
      : [];
      
    // get balances
    const balances = await db.select().from(accountBalances).where(eq(accountBalances.accountId, accountId));
    
    // get transactions
    const txs = await db.select().from(transactions).where(eq(transactions.accountId, accountId));
    
    // get entries
    const txIds = txs.map(t => t.id);
    const ents = txIds.length > 0 
      ? await db.select().from(transactionEntries).where(inArray(transactionEntries.transactionId, txIds))
      : [];
      
    return {
      success: true,
      account,
      users: accountUsers,
      members,
      balances,
      transactions: txs,
      entries: ents
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
export async function createAccountAction(userId: string, name: string, iconKey: string, currency: string) {
  try {
    const [newAccount] = await db.insert(accounts).values({
      name,
      iconKey,
      currency,
      createdBy: userId
    }).returning();
    
    await db.insert(accountMembers).values({
      accountId: newAccount.id,
      userId,
      role: 'owner'
    });
    
    await db.insert(accountBalances).values({
      accountId: newAccount.id,
      userId,
      balance: '0'
    });
    
    return { success: true, accountId: newAccount.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAccountPreviewAction(token: string) {
  try {
    const [account] = await db.select().from(accounts).where(eq(accounts.inviteToken, token));
    if (!account) return { success: false, error: "Not found" };

    const mems = await db.select().from(accountMembers).where(eq(accountMembers.accountId, account.id));
    const userIds = mems.map(m => m.userId);
    const accountUsers = userIds.length > 0 
      ? await db.select().from(users).where(inArray(users.id, userIds))
      : [];

    return { success: true, account, users: accountUsers };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function joinAccountAction(token: string, userId: string) {
  try {
    const [account] = await db.select().from(accounts).where(eq(accounts.inviteToken, token));
    if (!account) return { success: false, error: "Not found" };

    const existingMember = await db.select().from(accountMembers).where(
      and(
        eq(accountMembers.accountId, account.id),
        eq(accountMembers.userId, userId)
      )
    );

    if (existingMember.length === 0) {
      await db.insert(accountMembers).values({
        accountId: account.id,
        userId: userId,
        role: 'member'
      });

      await db.insert(accountBalances).values({
        accountId: account.id,
        userId: userId,
        balance: '0'
      });
    }

    return { success: true, accountId: account.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
export async function addTransactionAction(accountId: string, description: string, amount: number, splits: {userId: string, paid: number, owed: number}[]) {
  try {
    const [newTx] = await db.insert(transactions).values({
      accountId,
      description,
      totalAmount: amount.toString(),
      currency: 'EUR',
      createdBy: splits[0].userId,
      type: 'expense'
    } as any).returning();

    for (const split of splits) {
      const netAmount = split.paid - split.owed;
      await db.insert(transactionEntries).values({
        transactionId: newTx.id,
        accountId: accountId,
        userId: split.userId,
        paidAmount: split.paid.toString(),
        owedAmount: split.owed.toString(),
      } as any);

      // Update account balance
      const [currBal] = await db.select().from(accountBalances)
        .where(and(eq(accountBalances.accountId, accountId), eq(accountBalances.userId, split.userId)));
      
      if (currBal) {
        const newBalance = parseFloat(currBal.balance) + netAmount;
        await db.update(accountBalances)
          .set({ balance: newBalance.toString() })
          .where(and(eq(accountBalances.accountId, accountId), eq(accountBalances.userId, split.userId)));
      } else {
        await db.insert(accountBalances).values({
          accountId,
          userId: split.userId,
          balance: netAmount.toString()
        });
      }
    }
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
