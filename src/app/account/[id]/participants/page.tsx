"use client";

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/data/store';
import Header from '@/components/layout/Header';
import { getAccountData } from '@/actions/app';

export default function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { currentUser } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

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
          setMembers(res.members || []);
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

  const accountMembers = members.map(m => {
    const user = users.find(u => u.id === (m.userId || m.user_id));
    return { ...m, user };
  }).filter(m => m.user !== undefined);

  return (
    <div className="bg-background text-on-background min-h-screen font-body-lg flex flex-col pt-16">
      <Header title="Participantes" showBack />
      
      <main className="flex-grow px-4 py-6 max-w-3xl mx-auto w-full">
        <div className="space-y-2 mb-8">
          {accountMembers.map(m => {
            const userId = m.userId || m.user_id;
            return (
              <div key={m.id} className="bg-surface-container-lowest border border-outline-variant shadow-sm rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-base text-on-surface">
                      {m.user?.displayName || m.user?.display_name} {userId === currentUser?.id ? "(tú)" : ""}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      {m.user?.isGhost || m.user?.is_ghost ? "Invitado" : "Registrado"} • {m.role === 'owner' ? "Creador" : "Miembro"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
