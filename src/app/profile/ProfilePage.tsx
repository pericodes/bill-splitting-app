"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import BottomNav from "@/components/layout/BottomNav";
import { useAlert } from "@/components/common/AlertProvider";
import { completeAuthAction, updateUserNameAction } from "@/actions/app";
import { neonSignIn, neonSignOut, neonSignUp } from "@/lib/clientAuth";
import { useHasHydrated, useStore, type AppLanguage } from "@/data/store";

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const hasHydrated = useHasHydrated();
  const { currentUser, setCurrentUser, language, setLanguage, logout } = useStore();
  const { showAlert } = useAlert();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!hasHydrated) return;
    if (!currentUser) {
      router.push("/");
      return;
    }
    setName(currentUser.display_name || "");
    setRegisterName(currentUser.display_name || "");
  }, [hasHydrated, currentUser, router]);

  const handleLogout = async () => {
    await neonSignOut();
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
        showAlert({ title: t("common.error"), description: res.error || t("profile.save_name_error") });
        return;
      }
      setCurrentUser({ ...currentUser, display_name: name.trim() });
    } finally {
      setSaving(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !currentUser.session_secret) {
      setAuthError(t("welcome.unexpected_error"));
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const token =
        authTab === "register"
          ? await neonSignUp(email, password, registerName.trim() || currentUser.display_name)
          : await neonSignIn(email, password);
      const res = await completeAuthAction({
        authToken: token,
        displayName: authTab === "register" ? registerName.trim() || currentUser.display_name : undefined,
        ghost: { id: currentUser.id, session_secret: currentUser.session_secret },
      });
      if (!res.success || !res.user) {
        throw new Error(res.error || t("welcome.unexpected_error"));
      }
      setCurrentUser(res.user);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : t("welcome.unexpected_error"));
    } finally {
      setAuthLoading(false);
    }
  };

  if (!hasHydrated || !currentUser) {
    return <div className="min-h-screen flex items-center justify-center">{t("profile.loading")}</div>;
  }

  const fieldClass =
    "w-full pl-10 pr-3 py-3 bg-surface-container-low border border-surface-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-base text-on-surface placeholder:text-outline-variant transition-all outline-none";

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col pb-24 md:pb-0 relative">
      <header className="hidden md:flex justify-between items-center w-full px-8 h-16 bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-30">
        <h1 className="text-xl font-bold text-on-surface">{t("common.app_name")}</h1>
        <nav className="flex gap-6 items-center">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-primary uppercase tracking-wider hover:bg-surface-container-high px-4 py-2 rounded-lg transition-colors"
          >
            {t("nav.accounts")}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-semibold text-error uppercase tracking-wider hover:bg-error-container/20 px-4 py-2 rounded-lg transition-colors"
          >
            {t("common.close_session")}
          </button>
        </nav>
      </header>

      <main className="flex-grow w-full max-w-lg mx-auto px-4 md:px-6 pt-6 pb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-6">{t("profile.title")}</h2>

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
                {currentUser.is_ghost ? t("profile.local_profile") : t("profile.registered_account")}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="profile-name" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                {t("profile.name")}
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
              {saving ? t("common.saving") : t("profile.save_name")}
            </button>
          </form>
        </section>

        <section className="mt-6 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-6 flex flex-col gap-3">
          <label htmlFor="profile-language" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            {t("profile.language")}
          </label>
          <select
            id="profile-language"
            value={language === "en" ? "en" : "es"}
            onChange={(e) => setLanguage(e.target.value as AppLanguage)}
            className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
          >
            <option value="es">{t("profile.language_es")}</option>
            <option value="en">{t("profile.language_en")}</option>
          </select>
        </section>

        {currentUser.is_ghost && (
          <section className="mt-6 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="p-6 pb-4">
              <h3 className="text-lg font-bold text-on-surface">{t("profile.auth_title")}</h3>
              <p className="text-sm text-on-surface-variant mt-1">{t("profile.auth_hint")}</p>
            </div>
            <div className="flex border-b border-surface-variant px-4">
              <button
                type="button"
                onClick={() => setAuthTab("login")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors text-center focus:outline-none border-b-2 ${
                  authTab === "login"
                    ? "text-primary border-primary"
                    : "text-outline-variant hover:text-on-surface-variant border-transparent"
                }`}
              >
                {t("profile.login_tab")}
              </button>
              <button
                type="button"
                onClick={() => setAuthTab("register")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors text-center focus:outline-none border-b-2 ${
                  authTab === "register"
                    ? "text-primary border-primary"
                    : "text-outline-variant hover:text-on-surface-variant border-transparent"
                }`}
              >
                {t("profile.register_tab")}
              </button>
            </div>
            <form onSubmit={handleAuth} className="p-6 flex flex-col gap-4">
              {authTab === "register" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant block uppercase tracking-wider">
                    {t("welcome.your_name")}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">person</span>
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder={t("welcome.name_placeholder")}
                      required
                      className={fieldClass}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant block uppercase tracking-wider">
                  {t("welcome.email")}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("welcome.email_placeholder")}
                    required
                    className={fieldClass}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant block uppercase tracking-wider">
                  {t("welcome.password")}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className={fieldClass}
                  />
                </div>
              </div>
              {authError && (
                <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm flex gap-2 items-start">
                  <span className="material-symbols-outlined text-lg mt-0.5">error</span>
                  <p>{authError}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-on-primary font-semibold text-base py-3 rounded-lg shadow-sm transition-all"
              >
                {authLoading
                  ? t("common.loading")
                  : authTab === "login"
                    ? t("welcome.enter")
                    : t("welcome.create_account")}
              </button>
            </form>
          </section>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="md:hidden mt-6 w-full py-3 border border-error text-error rounded-lg font-semibold text-sm tracking-wider hover:bg-error-container/20 transition-colors"
        >
          {t("common.close_session")}
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
