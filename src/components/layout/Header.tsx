"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  accountName?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function Header({ title, accountName, showBack, onBack, rightAction }: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-surface-container-lowest border-b border-outline-variant grid grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8 h-16">
      <div className="flex items-center justify-start">
        {showBack && (
          <button 
            onClick={handleBack}
            className="text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 -ml-2"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
      </div>
      <h1 className="text-xl font-bold text-on-surface truncate max-w-[240px] sm:max-w-sm text-center">
        {accountName ? `${accountName}: ${title}` : title}
      </h1>
      <div className="flex items-center justify-end">
        {rightAction}
      </div>
    </header>
  );
}
