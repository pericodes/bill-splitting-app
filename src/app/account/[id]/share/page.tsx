"use client";

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/data/store';
import Header from '@/components/layout/Header';
import { getAccountData } from '@/actions/app';

export default function ShareAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { currentUser } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');

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

  useEffect(() => {
    if (account) {
      const inviteToken = account.inviteToken || account.invite_token || account.id; // Fallback to id if no token
      const url = `${window.location.origin}/join/${inviteToken}`;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJoinUrl(url);
    }
  }, [account]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!account) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col pt-16">
      <Header title={account.name} showBack />
      
      <main className="flex-grow flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full">
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-lg p-6 border border-surface-variant mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Invitar a participantes</h2>
          <p className="text-sm text-on-surface-variant mb-8">Comparte tu cuenta para dividir gastos fácilmente.</p>
          
          {/* QR Code Area */}
          <div className="mb-8 flex justify-center">
            <div className="p-4 bg-surface-container-highest rounded-xl shadow-inner relative group cursor-pointer hover:shadow-lg transition-all duration-300">
              <svg className="w-48 h-48 text-primary group-hover:scale-105 transition-transform duration-300" fill="currentColor" viewBox="0 0 100 100">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 10h30v30H10V10zm5 5v20h20V15H15zm45-5h30v30H60V10zm5 5v20h20V15H65zM10 60h30v30H10V60zm5 5v20h20V65H15zm65 10v15H60V60h25v15zM20 20h10v10H20V20zm50 0h10v10H70V20zm-50 50h10v10H20V70zM45 10h10v15H45V10zm0 30h10v15H45V40zm0 30h10v15H45V70zm15-15h25v10H60V55zM25 45h15v10H25V45zm15 15h15v10H40V60z" />
              </svg>
              <div className="absolute inset-0 bg-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
          
          {/* Link Section */}
          <div className="mb-8 text-left">
            <label className="text-xs font-semibold text-on-surface-variant mb-2 block uppercase tracking-wider">Enlace de invitación</label>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
                  <span className="material-symbols-outlined text-[18px]">link</span>
                </span>
                <input 
                  type="text" 
                  readOnly 
                  value={joinUrl} 
                  className="w-full bg-surface border border-outline-variant text-on-surface text-sm rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-ellipsis"
                />
              </div>
              <button 
                onClick={handleCopy}
                className={`border font-semibold px-4 py-3 rounded-lg transition-colors whitespace-nowrap flex justify-center items-center gap-2 ${copied ? 'bg-secondary text-on-secondary border-secondary' : 'bg-surface border-primary text-primary hover:bg-surface-container-high'}`}
              >
                <span className="material-symbols-outlined text-[20px]">{copied ? 'check' : 'content_copy'}</span>
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => router.push(`/account/${id}`)}
          className="w-full bg-primary text-on-primary font-semibold text-base rounded-lg py-4 hover:bg-primary-fixed-dim shadow-sm hover:shadow-md transition-all duration-200 flex justify-center items-center gap-2"
        >
          Volver a la cuenta
        </button>
      </main>
    </div>
  );
}
