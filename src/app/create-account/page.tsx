"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { createAccountAction } from '@/actions/app';
import { useStore } from '@/data/store';

export default function CreateAccountPage() {
  const router = useRouter();
  const { currentUser } = useStore();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [iconKey, setIconKey] = useState('flight');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  const icons = [
    'flight', 'restaurant', 'home', 'sports_esports', 
    'shopping_bag', 'directions_car', 'school', 'savings'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentUser?.id) return;
    setLoading(true);
    
    try {
      const res = await createAccountAction(currentUser.id, name.trim(), iconKey, currency);
      if (res.success && res.accountId) {
        router.push(`/account/${res.accountId}`);
      } else {
        throw new Error(res.error || "Error al crear la cuenta");
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "No se pudo crear la cuenta.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen pb-24 md:pb-8 flex flex-col font-body-lg pt-16">
      <Header title="Crear Cuenta" showBack />
      
      <main className="flex-grow flex flex-col items-center justify-start px-4 py-6 overflow-y-auto">
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant p-6 flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-2">Crear Nueva Cuenta</h2>
            <p className="text-sm text-on-surface-variant">Configura los detalles de tu nueva cuenta financiera.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Nombre de la cuenta</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Ahorros Viaje"
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Moneda principal</label>
              <div className="relative">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="appearance-none w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow pr-10"
                >
                  <option value="EUR">Euro (EUR - €)</option>
                  <option value="USD">Dólar Estadounidense (USD - $)</option>
                  <option value="GBP">Libra Esterlina (GBP - £)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Selecciona un icono</label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                {icons.map(icon => (
                  <label key={icon} className="cursor-pointer relative">
                    <input
                      type="radio"
                      name="iconKey"
                      value={icon}
                      checked={iconKey === icon}
                      onChange={() => setIconKey(icon)}
                      className="peer sr-only"
                    />
                    <div className="w-14 h-14 rounded-xl border border-outline-variant flex items-center justify-center transition-all duration-200 peer-checked:bg-primary-fixed peer-checked:border-primary peer-checked:text-primary hover:bg-surface-container-low text-on-surface-variant">
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary font-semibold py-4 px-6 rounded-lg shadow-sm hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">add_circle</span>
                {loading ? "Creando..." : "Crear Cuenta"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
