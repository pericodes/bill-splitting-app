"use client";

import React, { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/data/store';
import Header from '@/components/layout/Header';
import { useAlert } from '@/components/common/AlertProvider';
import { getAccountData, addTransactionAction } from '@/actions/app';

export default function AddExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { currentUser } = useStore();
  const { showAlert } = useAlert();
  
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [splits, setSplits] = useState<Record<string, { paid: number, owed: number }>>({});

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
          const accMembers = res.members || [];
          setMembers(accMembers);
          
          // Initialize splits
          const initialSplits = accMembers.reduce((acc: any, m: any) => {
            const userId = m.userId || m.user_id;
            acc[userId] = { paid: userId === currentUser?.id ? parseFloat(amount) || 0 : 0, owed: 0 };
            return acc;
          }, {} as Record<string, { paid: number, owed: number }>);
          setSplits(initialSplits);
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
  }, [id, currentUser, router, amount]); // Only run when needed, amount affects initial paid but we handle that separately below
  
  const accountMembers = members.map(m => {
    const user = users.find(u => u.id === (m.userId || m.user_id));
    return { ...m, user };
  }).filter(m => m.user !== undefined);

  const totalOwed = Object.values(splits).reduce((sum, s) => sum + (s.owed || 0), 0);
  const totalPaid = Object.values(splits).reduce((sum, s) => sum + (s.paid || 0), 0);

  const handleEqualSplit = (totalAmount: number) => {
    if (accountMembers.length === 0) return;
    const splitAmount = parseFloat((totalAmount / accountMembers.length).toFixed(2));
    
    // Adjust for rounding
    let currentSum = splitAmount * accountMembers.length;
    const diff = totalAmount - currentSum;
    
    setSplits(prev => {
      const next = { ...prev };
      let idx = 0;
      for (const m of accountMembers) {
        let owed = splitAmount;
        if (idx === 0) owed += diff; // add difference to first person
        
        const userId = m.userId || m.user_id;
        // Paid is assumed 100% current user unless they changed it manually
        next[userId] = { 
          paid: userId === currentUser?.id ? totalAmount : 0, 
          owed: parseFloat(owed.toFixed(2)) 
        };
        idx++;
      }
      return next;
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val);
    const numVal = parseFloat(val) || 0;
    handleEqualSplit(numVal);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount <= 0) {
      showAlert({ title: "Error", description: "El importe debe ser mayor que cero." });
      return;
    }
    
    if (Math.abs(totalOwed - numAmount) > 0.05 || Math.abs(totalPaid - numAmount) > 0.05) {
      showAlert({ 
        title: "Error de cuadre", 
        description: `Lo pagado (${totalPaid}) y lo asignado (${totalOwed}) deben coincidir con el total (${numAmount}).` 
      });
      return;
    }

    const splitArray = Object.entries(splits).map(([userId, s]) => ({
      userId,
      paid: s.paid,
      owed: s.owed
    }));

    setSaving(true);
    try {
      const res = await addTransactionAction(id, description || "Nuevo Gasto", numAmount, splitArray);
      if (res.success) {
        router.push(`/account/${id}`);
      } else {
        showAlert({ title: "Error", description: res.error || "No se pudo guardar el gasto" });
      }
    } catch (err: any) {
      showAlert({ title: "Error", description: err.message || "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!account) return null;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col antialiased pt-16">
      <Header title="Añadir Gasto" showBack />
      
      <main className="flex-1 overflow-y-auto p-4 pb-24 max-w-2xl mx-auto w-full">
        <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm mb-6">
          <div className="mb-6">
            <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">IMPORTE TOTAL</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-4xl font-bold text-on-surface-variant">
                {account.currency === 'USD' ? '$' : account.currency === 'GBP' ? '£' : '€'}
              </span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="block w-full pl-12 pr-3 py-4 border-b border-outline-variant bg-transparent text-4xl font-bold text-on-surface focus:outline-none focus:border-primary transition-colors text-right"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">CONCEPTO</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Cena en restaurante"
              className="block w-full px-3 py-3 border border-outline-variant rounded-lg bg-transparent text-base text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-on-surface">División (Deuda)</h2>
            <button 
              type="button" 
              onClick={() => handleEqualSplit(parseFloat(amount) || 0)}
              className="text-xs font-semibold text-primary underline"
            >
              Partes iguales
            </button>
          </div>
          
          <div className="space-y-4">
            {accountMembers.map((m) => {
              const userId = m.userId || m.user_id;
              return (
                <div key={userId} className="flex items-center justify-between border-b border-surface-container pb-3 last:border-0">
                  <span className="text-base text-on-surface">{m.user?.displayName || m.user?.display_name} {userId === currentUser?.id ? "(tú)" : ""}</span>
                  <div className="relative w-32">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center font-semibold text-on-surface-variant">
                      {account.currency === 'USD' ? '$' : account.currency === 'GBP' ? '£' : '€'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={splits[userId]?.owed || ''}
                      onChange={(e) => setSplits({
                        ...splits, 
                        [userId]: { ...splits[userId], owed: parseFloat(e.target.value) || 0 }
                      })}
                      className="block w-full pl-6 pr-2 py-2 border border-outline-variant rounded-md bg-transparent text-base font-semibold text-on-surface focus:outline-none focus:border-primary text-right transition-colors"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between items-center text-sm">
            <span className="text-on-surface-variant">Total asignado:</span>
            <span className={`font-semibold ${Math.abs(totalOwed - (parseFloat(amount) || 0)) > 0.05 ? 'text-error' : 'text-on-surface'}`}>
              {totalOwed.toFixed(2)} / {(parseFloat(amount) || 0).toFixed(2)}
            </span>
          </div>
        </section>
        
        {/* Simple Who paid section */}
        <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm mb-6">
          <h2 className="text-xl font-bold text-on-surface mb-4">¿Quién pagó?</h2>
          <div className="space-y-4">
            {accountMembers.map((m) => {
              const userId = m.userId || m.user_id;
              return (
                <div key={userId} className="flex items-center justify-between border-b border-surface-container pb-3 last:border-0">
                  <span className="text-base text-on-surface">{m.user?.displayName || m.user?.display_name}</span>
                  <div className="relative w-32">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center font-semibold text-on-surface-variant">
                      {account.currency === 'USD' ? '$' : account.currency === 'GBP' ? '£' : '€'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={splits[userId]?.paid || ''}
                      onChange={(e) => setSplits({
                        ...splits, 
                        [userId]: { ...splits[userId], paid: parseFloat(e.target.value) || 0 }
                      })}
                      className="block w-full pl-6 pr-2 py-2 border border-outline-variant rounded-md bg-transparent text-base font-semibold text-on-surface focus:outline-none focus:border-primary text-right transition-colors"
                    />
                  </div>
                </div>
              );
            })}
          </div>
           <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between items-center text-sm">
            <span className="text-on-surface-variant">Total pagado:</span>
            <span className={`font-semibold ${Math.abs(totalPaid - (parseFloat(amount) || 0)) > 0.05 ? 'text-error' : 'text-on-surface'}`}>
              {totalPaid.toFixed(2)} / {(parseFloat(amount) || 0).toFixed(2)}
            </span>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-surface to-transparent pb-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSave}
            className="w-full bg-secondary text-on-secondary text-xl font-bold py-4 rounded-xl shadow-lg shadow-secondary/30 hover:bg-secondary/90 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">check</span>
            Guardar Gasto
          </button>
        </div>
      </div>
    </div>
  );
}
