"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname() || '';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container-lowest border-t border-outline-variant shadow-lg rounded-t-xl pb-safe">
      <Link 
        href="/dashboard"
        className={`flex flex-col items-center justify-center transition-all ${
          pathname === '/dashboard' || pathname.startsWith('/account/')
            ? "bg-primary-container text-on-primary-container rounded-full px-6 py-1 scale-90"
            : "text-on-surface-variant hover:opacity-80"
        }`}
      >
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: pathname === '/dashboard' || pathname.startsWith('/account/') ? "'FILL' 1" : "'FILL' 0" }}>
          account_balance_wallet
        </span>
        <span className="text-[12px] font-semibold tracking-wider">Cuentas</span>
      </Link>
      
      <Link 
        href="/activities"
        className={`flex flex-col items-center justify-center transition-all ${
          pathname === '/activities'
            ? "bg-primary-container text-on-primary-container rounded-full px-6 py-1 scale-90"
            : "text-on-surface-variant hover:opacity-80"
        }`}
      >
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: pathname === '/activities' ? "'FILL' 1" : "'FILL' 0" }}>
          history
        </span>
        <span className="text-[12px] font-semibold tracking-wider">Actividades</span>
      </Link>
      
      <Link 
        href="/profile"
        className={`flex flex-col items-center justify-center transition-all ${
          pathname === '/profile'
            ? "bg-primary-container text-on-primary-container rounded-full px-6 py-1 scale-90"
            : "text-on-surface-variant hover:opacity-80"
        }`}
      >
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: pathname === '/profile' ? "'FILL' 1" : "'FILL' 0" }}>
          person
        </span>
        <span className="text-[12px] font-semibold tracking-wider">Perfil</span>
      </Link>
    </nav>
  );
}
