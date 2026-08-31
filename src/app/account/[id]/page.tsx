"use client";

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { useStore } from '@/data/store';
import Header from '@/components/layout/Header';
import { getAccountData } from '@/actions/app';

export default function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { currentUser } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [accountBalances, setAccountBalances] = useState<any[]>([]);
  const [accountTxs, setAccountTxs] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  
  useEffect(() => {
    if (!currentUser) {
      router.push('/');
      return;
    }
    
    const fetchData = async () => {
      try {
        const res = await getAccountData(id);
        if (res.success && res.account) {
          setAccount(res.account);
          setUsers(res.users || []);
          setAccountBalances(res.balances || []);
          
          const sortedTxs = (res.transactions || []).sort((a: any, b: any) => 
            new Date(b.occurredOn || b.occurred_on).getTime() - new Date(a.occurredOn || a.occurred_on).getTime()
          );
          setAccountTxs(sortedTxs);
          setEntries(res.entries || []);
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, currentUser, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!account) return null;

  const myBalance = parseFloat(accountBalances.find(b => b.userId === currentUser?.id || b.user_id === currentUser?.id)?.balance || "0");
  
  return (
    <div className="bg-background text-on-background min-h-screen relative font-body-lg pt-16">
      <Header 
        title={account.name} 
        showBack 
        rightAction={
          <Link href={`/account/${id}/share`} className="text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors">
            <span className="material-symbols-outlined">share</span>
          </Link>
        }
      />
      
      <main className="pt-4 pb-32 px-4 max-w-3xl mx-auto flex flex-col gap-6">
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 flex flex-col items-center gap-4 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed to-transparent opacity-30 pointer-events-none"></div>
          
          <div className="z-10 flex flex-col items-center">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Gasto Total del Grupo</p>
            <h2 className="text-4xl font-bold text-on-surface mt-2">
              {accountTxs.reduce((sum, tx) => sum + parseFloat(tx.totalAmount || tx.total_amount || "0"), 0).toFixed(2)} {account.currency}
            </h2>
          </div>
          
          <div className="z-10 w-full flex flex-col items-center mt-4 gap-4">
            <div className={`w-full rounded-lg p-4 text-center ${myBalance >= 0 ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
              <p className="text-sm">Balance a tu favor</p>
              <p className={`text-base font-semibold mt-1 ${myBalance >= 0 ? 'text-secondary' : 'text-error'}`}>
                {myBalance >= 0 ? `Te deben ${myBalance.toFixed(2)}` : `Debes ${Math.abs(myBalance).toFixed(2)}`} {account.currency}
              </p>
            </div>
            
            <Link href={`/account/${id}/balances`} className="w-full py-2 bg-primary text-on-primary rounded-lg font-semibold text-xs tracking-wider transition-colors hover:bg-primary-fixed-dim shadow-sm flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">account_balance</span>
              VER SALDOS
            </Link>
            
            <Link href={`/account/${id}/participants`} className="w-full py-2 border border-primary text-primary rounded-lg font-semibold text-xs tracking-wider transition-colors hover:bg-primary-fixed-dim/10 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">group</span>
              VER PARTICIPANTES
            </Link>
          </div>
        </section>
        
        <section className="flex flex-col gap-4">
          {accountTxs.length === 0 ? (
            <div className="text-center py-10 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
              <p>No hay gastos todavía. Añade el primero.</p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden divide-y divide-outline-variant flex flex-col">
              {accountTxs.map(tx => {
                const txEntries = entries.filter(e => e.transactionId === tx.id || e.transaction_id === tx.id);
                const payers = txEntries.filter(e => parseFloat(e.paidAmount || e.paid_amount || "0") > 0);
                const myEntry = txEntries.find(e => e.userId === currentUser?.id || e.user_id === currentUser?.id);
                
                let payerName = "Alguien";
                if (payers.length === 1) {
                  const payerId = payers[0].userId || payers[0].user_id;
                  payerName = users.find(u => u.id === payerId)?.displayName || users.find(u => u.id === payerId)?.display_name || "Alguien";
                  if (payerId === currentUser?.id) payerName = "tú";
                } else if (payers.length > 1) {
                  payerName = "Varios";
                }

                const txAmount = parseFloat(tx.totalAmount || tx.total_amount || "0");
                const netAmount = parseFloat(myEntry?.netAmount || myEntry?.net_amount || "0");

                return (
                  <Link key={tx.id} href={`/account/${id}/expense?tx=${tx.id}`} className="p-5 flex items-center gap-4 hover:bg-surface-container-low transition-colors cursor-pointer no-underline text-inherit">
                    <div className="flex-1">
                      <h4 className="font-bold text-base text-on-surface">{tx.description}</h4>
                      <p className="text-sm text-outline mt-1">
                        {format(new Date(tx.occurredOn || tx.occurred_on), 'MMM dd')} • Pagó <span className="font-semibold">{payerName}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-on-surface tracking-tight">{txAmount.toFixed(2)} {tx.currency || account.currency}</p>
                      {myEntry && netAmount !== 0 && (
                        <p className={`text-xs font-medium mt-1 ${netAmount > 0 ? 'text-secondary' : 'text-error'}`}>
                          {netAmount > 0 ? '+' : ''}{netAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </main>
      
      <Link href={`/account/${id}/expense`} className="fixed bottom-24 md:bottom-6 right-6 w-14 h-14 bg-secondary text-on-secondary rounded-full shadow-lg shadow-secondary/30 flex items-center justify-center hover:bg-secondary/90 transition-all z-40">
        <span className="material-symbols-outlined text-2xl">add</span>
      </Link>
    </div>
  );
}
