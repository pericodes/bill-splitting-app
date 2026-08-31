"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useStore, useHasHydrated } from "@/data/store";
import { completeAuthAction, createGhostUser } from "@/actions/app";
import { neonSignIn, neonSignUp } from "@/lib/clientAuth";
import { cn } from "@/lib/utils";

export default function WelcomePage({ nextPath = null }: { nextPath?: string | null }) {
  const [tab, setTab] = useState<"ghost" | "login" | "register">(nextPath ? "login" : "ghost");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { t } = useTranslation();
  const hasHydrated = useHasHydrated();
  const { currentUser, setCurrentUser } = useStore();
  const afterAuth = nextPath || "/dashboard";
  const fromJoin = !!nextPath;

  useEffect(() => {
    if (!hasHydrated || !currentUser) return;
    router.push(afterAuth);
  }, [hasHydrated, currentUser, afterAuth, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (tab === "ghost") {
        if (fromJoin) {
          setLoading(false);
          return;
        }
        if (!name.trim()) {
          setError(t("welcome.name_required"));
          setLoading(false);
          return;
        }

        const res = await createGhostUser(name.trim());
        if (!res.success || !res.user) {
          throw new Error(res.error || t("welcome.guest_create_error"));
        }

        setCurrentUser(res.user);
        router.push(afterAuth);
        return;
      }

      const token =
        tab === "register"
          ? await neonSignUp(email, password, name.trim())
          : await neonSignIn(email, password);
      const res = await completeAuthAction({
        authToken: token,
        displayName: tab === "register" ? name.trim() : undefined,
      });
      if (!res.success || !res.user) {
        throw new Error(res.error || t("welcome.unexpected_error"));
      }
      setCurrentUser(res.user);
      router.push(afterAuth);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("welcome.unexpected_error"));
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full pl-10 pr-3 py-3 bg-surface-container-low border border-surface-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-base text-on-surface placeholder:text-outline-variant transition-all outline-none";

  if (!hasHydrated || currentUser) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <p className="text-on-surface-variant">{t("common.loading")}</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
      <a href="/" className="text-sm font-medium text-outline hover:text-primary">
        {t("welcome.back_home")}
      </a>
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-lg border border-surface-variant overflow-hidden">
        <div className="pt-8 pb-6 px-6 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              balance
            </span>
          </div>
          <h1 className="text-3xl font-bold text-primary">{t("common.brand")}</h1>
          <p className="text-sm text-outline mt-1">
            {fromJoin ? t("welcome.join_sign_in_hint") : t("welcome.subtitle")}
          </p>
        </div>

        <div className="flex border-b border-surface-variant px-4">
          {!fromJoin && (
            <button
              type="button"
              onClick={() => setTab("ghost")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors text-center focus:outline-none border-b-2 ${
                tab === "ghost"
                  ? "text-primary border-primary"
                  : "text-outline-variant hover:text-on-surface-variant border-transparent"
              }`}
            >
              {t("welcome.guest")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors text-center focus:outline-none border-b-2 ${
              tab === "login"
                ? "text-primary border-primary"
                : "text-outline-variant hover:text-on-surface-variant border-transparent"
            }`}
          >
            {t("welcome.login")}
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors text-center focus:outline-none border-b-2 ${
              tab === "register"
                ? "text-primary border-primary"
                : "text-outline-variant hover:text-on-surface-variant border-transparent"
            }`}
          >
            {t("welcome.register")}
          </button>
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleAuth} className="space-y-4">
            {(tab === "register" || tab === "ghost") && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant block uppercase tracking-wider">
                  {t("welcome.your_name")}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    person
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("welcome.name_placeholder")}
                    required={tab === "register" || tab === "ghost"}
                    className={fieldClass}
                  />
                </div>
              </div>
            )}

            {tab !== "ghost" && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant block uppercase tracking-wider">
                    {t("welcome.email")}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                      mail
                    </span>
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
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                      lock
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className={cn(fieldClass, "pr-12")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-outline hover:text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      aria-label={showPassword ? t("welcome.hide_password") : t("welcome.show_password")}
                      aria-pressed={showPassword}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm flex gap-2 items-start mt-2">
                <span className="material-symbols-outlined text-lg mt-0.5">error</span>
                <p>{error}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-on-primary font-semibold text-base py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  t("common.loading")
                ) : (
                  <>
                    {tab === "login"
                      ? t("welcome.enter")
                      : tab === "ghost"
                        ? t("welcome.enter_as_guest")
                        : t("welcome.create_account")}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </div>

            {tab === "ghost" && (
              <div className="text-center mt-2">
                <p className="text-xs text-outline">{t("welcome.ghost_hint")}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
