"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/layout/BottomNav';
import { useAlert } from '@/components/common/AlertProvider';
import { getDashboardData, deleteAccountAction } from '@/actions/app';
import { useHasHydrated, useStore } from '@/data/store';
import { isRateLimitError } from '@/lib/errors';
import { neonSignOut } from '@/lib/clientAuth';
import { useTranslation } from 'react-i18next';

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const hasHydrated = useHasHydrated();
  const {
    currentUser,
    logout,
    dashboardUserId,
    dashboardAccounts: accounts,
    dashboardBalances: balances,
    setDashboardData,
    removeDashboardAccount,
  } = useStore();
  const { showConfirm } = useAlert();

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const userId = currentUser?.id;
  const hasCache = !!userId && dashboardUserId === userId;

  const fetchAccounts = React.useCallback(async () => {
    if (!userId) return;
    setFetchError(null);
    if (useStore.getState().dashboardUserId !== userId) setLoading(true);

    try {
      const res = await getDashboardData(userId);
      if (res.success) {
        setDashboardData(userId, res.accounts || [], res.balances || {});
      } else {
        setFetchError(res.error || t("dashboard.load_error"));
      }
    } catch (err: any) {
      setFetchError(err.message || t("dashboard.load_error"));
    } finally {
      setLoading(false);
    }
  }, [userId, setDashboardData, t]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!currentUser) {
      router.push('/');
    }
  }, [hasHydrated, currentUser, router]);

  useEffect(() => {
    if (userId) fetchAccounts();
  }, [userId, fetchAccounts]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showConfirm({
      title: t("dashboard.delete_title"),
      description: t("dashboard.delete_desc"),
      isDestructive: true,
      confirmText: t("common.delete"),
      onConfirm: async () => {
        const res = await deleteAccountAction(id);
        if (!res.success) {
          console.error("Error deleting account:", res.error);
          alert(t("dashboard.delete_error"));
        } else {
          removeDashboardAccount(id);
          fetchAccounts();
        }
      }
    });
  };

  const handleLogout = async () => {
    await neonSignOut();
    logout();
    router.push('/');
  };

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">{t("dashboard.loading")}</div>;
  }

  if (loading && !hasCache) {
    return <div className="min-h-screen flex items-center justify-center">{t("dashboard.loading")}</div>;
  }

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col pb-24 md:pb-0 relative">
      {/* Top App Bar (Web) */}
      <header className="hidden md:flex justify-between items-center w-full px-8 h-16 bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-30">
        <h1 className="text-xl font-bold text-on-surface">{t("common.app_name")}</h1>
        <nav className="flex gap-6 items-center">
          <Link href="/profile" className="text-xs font-semibold text-primary uppercase tracking-wider hover:bg-surface-container-high px-4 py-2 rounded-lg transition-colors">{t("dashboard.view_profile")}</Link>
          <button 
            onClick={handleLogout}
            className="text-xs font-semibold text-error uppercase tracking-wider hover:bg-error-container/20 px-4 py-2 rounded-lg transition-colors"
          >
            {t("common.close_session")}
          </button>
        </nav>
      </header>

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 md:px-6 pt-6 pb-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface">{t("dashboard.my_accounts")}</h2>
            <p className="text-sm text-on-surface-variant mt-2">{t("dashboard.subtitle")}</p>
          </div>
        </div>

        {fetchError && (
          <div className="mb-6 rounded-xl border border-error-container bg-error-container/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-on-error-container">
              {isRateLimitError(fetchError)
                ? t("dashboard.rate_limit")
                : fetchError}
            </p>
            <button
              type="button"
              onClick={fetchAccounts}
              className="shrink-0 px-4 py-2 rounded-lg font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors"
            >
              {t("common.retry")}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link 
            href="/create-account"
            className="bg-primary hover:bg-primary/90 text-on-primary rounded-2xl p-5 flex flex-col items-center justify-center min-h-[160px] shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1 group border border-transparent cursor-pointer"
          >
            <div className="bg-surface-container-lowest/20 rounded-full p-3 mb-2 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[32px]">add</span>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider mt-2">{t("dashboard.create_account")}</span>
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
                  <span className="text-sm text-on-surface-variant">{t("dashboard.my_balance")}</span>
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
