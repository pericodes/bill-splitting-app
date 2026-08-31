"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import Header from '@/components/layout/Header';
import { useAccountData } from '../AccountDataProvider';
import { useTranslation } from 'react-i18next';

export default function ShareAccountPage() {
  const { t } = useTranslation();
  const { accountId: id, data } = useAccountData();
  const { account } = data;
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    const inviteToken = account.inviteToken || account.invite_token || account.id;
    setJoinUrl(`${window.location.origin}/join/${inviteToken}`);
  }, [account]);

  const handleCopy = async () => {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
    } catch {
      const input = document.createElement('textarea');
      input.value = joinUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col pt-16">
      <Header title={t("share.title")} accountName={account.name} showBack />
      
      <main className="flex-grow flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full">
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-lg p-6 border border-surface-variant mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">{t("share.heading")}</h2>
          <p className="text-sm text-on-surface-variant mb-8">{t("share.subtitle")}</p>
          
          <div className="mb-8 flex flex-col items-center">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!joinUrl}
              aria-label={copied ? t("share.copied_aria") : t("share.copy_aria")}
              className="p-4 bg-white rounded-xl shadow-inner relative group cursor-pointer hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-wait focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {joinUrl ? (
                <QRCode
                  value={joinUrl}
                  size={192}
                  fgColor="#026ffb"
                  bgColor="#ffffff"
                  level="M"
                  className="w-48 h-48 group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-48 h-48 bg-surface-container-high rounded-lg animate-pulse" />
              )}
              <div className={`absolute inset-0 rounded-xl flex items-center justify-center transition-opacity ${copied ? 'bg-primary/80 opacity-100' : 'bg-primary/5 opacity-0 group-hover:opacity-100'}`}>
                {copied && (
                  <span className="material-symbols-outlined text-on-primary text-5xl">check</span>
                )}
              </div>
            </button>
            <p className="mt-3 text-xs text-on-surface-variant">
              {copied ? t("share.copied") : t("share.copy_hint")}
            </p>
          </div>
          
          {/* Link Section */}
          <div className="mb-8 text-left">
            <label className="text-xs font-semibold text-on-surface-variant mb-2 block uppercase tracking-wider">{t("share.invitation_link")}</label>
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
                {copied ? t("share.copied") : t("share.copy")}
              </button>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => router.push(`/account/${id}`)}
          className="w-full bg-primary text-on-primary font-semibold text-base rounded-lg py-4 hover:bg-primary-fixed-dim shadow-sm hover:shadow-md transition-all duration-200 flex justify-center items-center gap-2"
        >
          {t("share.back")}
        </button>
      </main>
    </div>
  );
}
