"use client";

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/data/store';
import { getAccountPreviewAction, joinAccountAction, createGhostUser } from '@/actions/app';

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const { token } = resolvedParams;
  const router = useRouter();
  
  const { currentUser, setCurrentUser } = useStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [joining, setJoining] = useState(false);
  
  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await getAccountPreviewAction(token);
        if (res.success && res.account) {
          setAccount(res.account);
          setUsers(res.users || []);
        } else {
          router.push('/');
        }
      } catch (err) {
        console.error(err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreview();
  }, [token, router]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Cargando invitación...</div>;
  }

  if (!account) return null;

  const currentMembers = users;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joining) return;
    setJoining(true);

    let activeUserId = currentUser?.id;

    if (!activeUserId) {
      if (!name.trim()) {
        setJoining(false);
        return;
      }
      const res = await createGhostUser(name.trim());
      if (res.success && res.user) {
        setCurrentUser(res.user);
        activeUserId = res.user.id;
      } else {
        alert("Error creating user");
        setJoining(false);
        return;
      }
    }

    if (activeUserId) {
      const res = await joinAccountAction(token, activeUserId);
      if (res.success) {
        router.push(`/account/${res.accountId}`);
      } else {
        alert("Error joining account");
        setJoining(false);
      }
    }
  };

  return (
    <div className="bg-surface text-on-surface h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-container rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary-container rounded-full blur-[120px]"></div>
      </div>
      
      <main className="z-10 w-full max-w-sm px-4 flex flex-col items-center">
        <div className="w-24 h-24 bg-surface-container-highest rounded-full flex items-center justify-center mb-6 shadow-sm border border-outline-variant">
          <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            {account.iconKey || account.icon_key || 'wallet'}
          </span>
        </div>
        
        <div className="text-center mb-8 w-full">
          <h1 className="text-2xl font-bold text-on-surface mb-2">{account.name}</h1>
          <p className="text-base text-on-surface-variant">Has sido invitado a unirte al grupo de gastos compartidos.</p>
        </div>
        
        <div className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4 mb-8 flex flex-col">
          <h2 className="text-xs font-semibold text-outline mb-4 uppercase tracking-wider">Participantes Actuales</h2>
          <ul className="flex flex-col gap-2">
            {currentMembers.slice(0, 3).map((user, i) => (
              <li key={i} className="flex items-center gap-2 text-base font-semibold text-on-surface">
                <span className="material-symbols-outlined text-outline text-[20px]">person</span>
                {user?.displayName || user?.display_name}
              </li>
            ))}
            {currentMembers.length > 3 && (
              <li className="flex items-center gap-2 text-sm text-outline italic">
                ... y {currentMembers.length - 3} más
              </li>
            )}
          </ul>
          <div className="mt-4 pt-2 border-t border-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">group_add</span>
            <span className="text-sm text-on-surface-variant">Serás el {currentMembers.length + 1}º participante</span>
          </div>
        </div>

        <form onSubmit={handleJoin} className="w-full flex flex-col gap-4">
          {!currentUser && (
            <div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre (Ej. Laura)"
                className="w-full px-4 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                disabled={joining}
              />
            </div>
          )}
          
          <button 
            type="submit"
            disabled={joining}
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold text-xl rounded-xl py-4 px-6 transition-colors duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined">login</span>
            {joining ? 'Uniéndose...' : 'Unirse al Grupo'}
          </button>
        </form>
        
        <button onClick={() => router.push('/')} className="mt-6 text-sm text-outline hover:text-on-surface transition-colors" disabled={joining}>
          Cancelar y volver al inicio
        </button>
      </main>
    </div>
  );
}
