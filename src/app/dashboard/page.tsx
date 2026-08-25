"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/layout/BottomNav';
import { useAlert } from '@/components/common/AlertProvider';
import { getDashboardData, deleteAccountAction } from '@/actions/app';
import { useStore } from '@/data/store';

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, logout } = useStore();
  const { showConfirm } = useAlert();
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchAccounts = React.useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    
    try {
      const res = await getDashboardData(currentUser.id);
      if (res.success) {
        setAccounts(res.accounts || []);
        setBalances(res.balances || {});
      } else {
        console.error("Error fetching accounts:", res.error);
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
    } else {
      fetchAccounts();
    }
  }, [currentUser, router, fetchAccounts]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showConfirm({
      title: 'Eliminar cuenta',
      description: '¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.',
      isDestructive: true,
      confirmText: 'Eliminar',
      onConfirm: async () => {
        const res = await deleteAccountAction(id);
        if (!res.success) {
          console.error("Error deleting account:", res.error);
          alert("Error al eliminar la cuenta");
        } else {
          fetchAccounts();
        }
      }
    });
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!currentUser || loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando dashboard...</div>;
  }

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col pb-24 md:pb-0 relative">
      {/* Top App Bar (Web) */}
      <header className="hidden md:flex justify-between items-center w-full px-8 h-16 bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-30">
        <h1 className="text-xl font-bold text-on-surface">Gastos Compartidos</h1>
        <nav className="flex gap-6 items-center">
          <Link href="/dashboard" className="text-xs font-semibold text-primary uppercase tracking-wider hover:bg-surface-container-high px-4 py-2 rounded-lg transition-colors">Cuentas</Link>
          <button 
            onClick={handleLogout}
            className="text-xs font-semibold text-error uppercase tracking-wider hover:bg-error-container/20 px-4 py-2 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </nav>
      </header>

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 md:px-6 pt-6 pb-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface">Mis Cuentas</h2>
            <p className="text-sm text-on-surface-variant mt-2">Gestiona tus gastos compartidos recientes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link 
            href="/create-account"
            className="bg-primary hover:bg-primary/90 text-on-primary rounded-2xl p-5 flex flex-col items-center justify-center min-h-[160px] shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1 group border border-transparent cursor-pointer"
          >
            <div className="bg-surface-container-lowest/20 rounded-full p-3 mb-2 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[32px]">add</span>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider mt-2">Crear nueva cuenta</span>
          </Link>

          {accounts.map(account => {
            const myBalance = balances[account.id] || 0;
            
            return (
              <Link 
                key={account.id} 
                href={`/account/${account.id}`}
                className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="bg-surface-container-low rounded-lg p-2 text-primary">
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {account.iconKey || account.icon_key || 'wallet'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleDelete(account.id, e)}
                      className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error-container/50 focus:outline-none z-10"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-on-surface mt-auto">{account.name}</h3>
                
                <div className="mt-auto border-t border-surface-variant pt-2 flex justify-between items-center relative z-10">
                  <span className="text-sm text-on-surface-variant">Mi saldo</span>
                  <span className={`text-base font-semibold ${myBalance >= 0 ? (myBalance === 0 ? 'text-on-surface' : 'text-secondary') : 'text-error'}`}>
                    {myBalance > 0 ? '+' : ''}{myBalance.toFixed(2)} {account.currency}
                  </span>
                </div>
                
                <div className="absolute -bottom-6 -right-6 text-surface-container-highest opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none">
                  <span className="material-symbols-outlined text-[120px]">{account.iconKey || account.icon_key || 'wallet'}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </main>

      <BottomNav />

      <Link 
        href="/create-account"
        className="md:hidden fixed bottom-20 right-4 bg-secondary text-on-secondary w-14 h-14 rounded-full shadow-lg shadow-secondary/30 flex items-center justify-center hover:bg-secondary/90 transition-colors z-40"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </Link>
    </div>
  );
}
