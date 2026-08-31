"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import { useAlert } from "@/components/common/AlertProvider";
import { updateUserNameAction } from "@/actions/app";
import { useHasHydrated, useStore } from "@/data/store";

export default function ProfilePage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const { currentUser, setCurrentUser, logout } = useStore();
  const { showAlert } = useAlert();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!currentUser) {
      router.push("/");
      return;
    }
    setName(currentUser.display_name || "");
  }, [hasHydrated, currentUser, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setSaving(true);
    try {
      const res = await updateUserNameAction(currentUser.id, name);
      if (!res.success) {
        showAlert({ title: "Error", description: res.error || "No se pudo guardar el nombre." });
        return;
      }
      setCurrentUser({ ...currentUser, display_name: name.trim() });
    } finally {
      setSaving(false);
    }
  };

  if (!hasHydrated || !currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Cargando perfil...</div>;
  }

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col pb-24 md:pb-0 relative">
      <header className="hidden md:flex justify-between items-center w-full px-8 h-16 bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-30">
        <h1 className="text-xl font-bold text-on-surface">Gastos Compartidos</h1>
        <nav className="flex gap-6 items-center">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-primary uppercase tracking-wider hover:bg-surface-container-high px-4 py-2 rounded-lg transition-colors"
          >
            Cuentas
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-semibold text-error uppercase tracking-wider hover:bg-error-container/20 px-4 py-2 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </nav>
      </header>

      <main className="flex-grow w-full max-w-lg mx-auto px-4 md:px-6 pt-6 pb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-6">Perfil</h2>

        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-6 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                person
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-on-surface truncate">{currentUser.display_name}</p>
              <p className="text-sm text-on-surface-variant">
                {currentUser.is_ghost ? "Perfil local de este navegador" : "Cuenta"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="profile-name" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Nombre
              </label>
              <input
                id="profile-name"
                type="text"
                required
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={saving || name.trim() === (currentUser.display_name || "").trim()}
              className="w-full py-3 bg-primary text-on-primary rounded-lg font-semibold text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {saving ? "Guardando..." : "Guardar nombre"}
            </button>
          </form>
        </section>

        <button
          type="button"
          onClick={handleLogout}
          className="md:hidden mt-6 w-full py-3 border border-error text-error rounded-lg font-semibold text-sm tracking-wider hover:bg-error-container/20 transition-colors"
        >
          Cerrar sesión
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
