"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { completeAuthAction } from "@/actions/app";
import { neonRequestPasswordReset, neonResetPassword } from "@/lib/clientAuth";
import { useHasHydrated, useStore } from "@/data/store";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full pl-10 pr-3 py-3 bg-surface-container-low border border-surface-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-base text-on-surface placeholder:text-outline-variant transition-all outline-none";

export default function ResetPasswordPage({
  token,
  invalidToken,
  email: emailFromQuery,
}: {
  token: string | null;
  invalidToken: boolean;
  email: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const { currentUser, setCurrentUser } = useStore();

  const [email, setEmail] = useState(emailFromQuery);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(invalidToken ? t("welcome.reset_invalid") : "");
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);

  const isReset = !!token;
  const heading = isReset ? t("welcome.reset_title") : t("welcome.forgot_password");
  const hint = isReset ? t("welcome.reset_hint") : t("welcome.forgot_hint");

  const toggleLabel = useMemo(
    () => (showPassword ? t("welcome.hide_password") : t("welcome.show_password")),
    [showPassword, t]
  );

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await neonRequestPasswordReset(email.trim());
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("welcome.unexpected_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError(t("welcome.reset_mismatch"));
      return;
    }
    if (!token) {
      setError(t("welcome.reset_invalid"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const authToken = await neonResetPassword(password, token);
      if (authToken) {
        const ghost =
          hasHydrated && currentUser?.is_ghost && currentUser.session_secret
            ? { id: currentUser.id, session_secret: currentUser.session_secret }
            : undefined;
        const res = await completeAuthAction({ authToken, ghost });
        if (res.success && res.user) {
          setCurrentUser(res.user);
          router.push("/dashboard");
          return;
        }
      }
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("welcome.reset_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
      <Link href="/login" className="text-sm font-medium text-outline hover:text-primary">
        {t("welcome.forgot_back")}
      </Link>
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-lg border border-surface-variant overflow-hidden">
        <div className="pt-8 pb-6 px-6 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock_reset
            </span>
          </div>
          <h1 className="text-2xl font-bold text-primary">{heading}</h1>
          <p className="text-sm text-outline mt-1">{hint}</p>
        </div>

        <div className="p-6 md:p-8">
          {done ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-on-surface">{t("welcome.reset_success")}</p>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center bg-primary hover:opacity-90 text-on-primary font-semibold text-base py-3 rounded-lg shadow-sm transition-all"
              >
                {t("welcome.enter")}
              </Link>
            </div>
          ) : sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-on-surface">{t("welcome.forgot_sent")}</p>
              <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
                {t("welcome.forgot_back")}
              </Link>
            </div>
          ) : (
            <form onSubmit={isReset ? handleReset : handleRequest} className="space-y-4">
              {!isReset && (
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
              )}

              {isReset && (
                <>
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
                        aria-label={toggleLabel}
                        aria-pressed={showPassword}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant block uppercase tracking-wider">
                      {t("welcome.reset_confirm")}
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                        lock
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        className={fieldClass}
                      />
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm flex gap-2 items-start">
                  <span className="material-symbols-outlined text-lg mt-0.5">error</span>
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-on-primary font-semibold text-base py-3 rounded-lg shadow-sm transition-all"
              >
                {loading ? t("common.loading") : isReset ? t("welcome.reset_submit") : t("welcome.forgot_send")}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
