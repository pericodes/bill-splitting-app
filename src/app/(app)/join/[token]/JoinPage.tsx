"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, useHasHydrated } from "@/data/store";
import {
  getAccountPreviewAction,
  joinAccountAction,
  createGhostUser,
  claimParticipantAction,
  type AccountPreviewUser,
} from "@/actions/app";
import { useTranslation } from "react-i18next";
import { useAlert } from "@/components/common/AlertProvider";

const NEW_PARTICIPANT = "__new__";

type PreviewAccount = {
  id: string;
  name: string;
  icon_key?: string;
  iconKey?: string;
  currency: string;
};

export default function JoinPage({ token }: { token: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const hasHydrated = useHasHydrated();
  const { showAlert, showConfirm } = useAlert();

  const { currentUser, setCurrentUser, patchDashboardAccount } = useStore();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<PreviewAccount | null>(null);
  const [users, setUsers] = useState<AccountPreviewUser[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [redirectingMember, setRedirectingMember] = useState(false);

  const loadPreview = async () => {
    const res = await getAccountPreviewAction(token);
    if (res.success && res.account) {
      setAccount(res.account as PreviewAccount);
      setUsers(res.users || []);
      return res.users || [];
    }
    router.push("/");
    return [];
  };

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        await loadPreview();
      } catch (err) {
        console.error(err);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per token
  }, [token, router]);

  useEffect(() => {
    if (!hasHydrated || !account || !currentUser) return;
    if (users.some((u) => u.id === currentUser.id)) {
      setRedirectingMember(true);
      router.replace(`/account/${account.id}`);
    }
  }, [hasHydrated, account, users, currentUser, router]);

  const claimErrorMessage = (error?: string) => {
    const raw = (error || "").toLowerCase();
    if (raw.includes("ya fue reclamado") || raw.includes("already claimed") || raw.includes("not found")) {
      return t("join.error_claimed");
    }
    if (raw.includes("sesión") || raw.includes("sesion") || raw.includes("session")) {
      return t("join.error_session");
    }
    return error || t("join.error_claim");
  };

  const goToAccount = (accountId: string, balance: number) => {
    if (!account) return;
    patchDashboardAccount(accountId, {
      name: account.name,
      icon: account.icon_key || account.iconKey,
      currency: account.currency,
      balance,
    });
    router.push(`/account/${accountId}`);
  };

  const joinAsNew = async () => {
    setJoining(true);
    try {
      let activeUser = currentUser;

      if (!activeUser) {
        if (!name.trim()) {
          showAlert({ title: t("common.error"), description: t("join.name_required") });
          return;
        }
        const created = await createGhostUser(name.trim());
        if (!created.success || !created.user) {
          showAlert({ title: t("common.error"), description: created.error || t("join.error_user") });
          return;
        }
        setCurrentUser(created.user);
        activeUser = created.user;
      }

      if (!activeUser.session_secret) {
        showAlert({ title: t("common.error"), description: t("join.error_session") });
        return;
      }

      const res = await joinAccountAction(token, activeUser.id, activeUser.session_secret);
      if (res.success && res.accountId) {
        goToAccount(res.accountId, 0);
      } else {
        showAlert({ title: t("common.error"), description: res.error || t("join.error_join") });
      }
    } finally {
      setJoining(false);
    }
  };

  const claimGuest = async (source: AccountPreviewUser) => {
    setJoining(true);
    try {
      const res = await claimParticipantAction({
        token,
        sourceUserId: source.id,
        target: currentUser
          ? { id: currentUser.id, session_secret: currentUser.session_secret || "" }
          : undefined,
      });
      if (res.success && res.accountId && res.user) {
        setCurrentUser(res.user);
        goToAccount(res.accountId, res.balance ?? 0);
        return;
      }
      showAlert({ title: t("common.error"), description: claimErrorMessage(res.error) });
      const nextUsers = await loadPreview();
      if (selected && selected !== NEW_PARTICIPANT && !nextUsers.some((u) => u.id === selected)) {
        setSelected(null);
      }
    } finally {
      setJoining(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joining || !selected) {
      if (!selected) {
        showAlert({ title: t("common.error"), description: t("join.select_required") });
      }
      return;
    }

    if (selected === NEW_PARTICIPANT) {
      await joinAsNew();
      return;
    }

    const source = users.find((u) => u.id === selected);
    if (!source) {
      showAlert({ title: t("common.error"), description: t("join.error_claimed") });
      await loadPreview();
      setSelected(null);
      return;
    }

    if (!source.is_ghost) {
      if (currentUser) return;
      router.push(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
      return;
    }

    showConfirm({
      title: t("join.claim_title", { name: source.display_name }),
      description: t("join.claim_desc"),
      isDestructive: true,
      confirmText: t("join.claim_confirm", { name: source.display_name }),
      onConfirm: () => {
        void claimGuest(source);
      },
    });
  };

  if (loading || !hasHydrated || redirectingMember) {
    return <div className="flex-1 flex items-center justify-center">{t("join.loading")}</div>;
  }

  if (!account) return null;

  const selectedUser = selected && selected !== NEW_PARTICIPANT ? users.find((u) => u.id === selected) : null;
  const submitLabel =
    joining
      ? t("join.joining")
      : selectedUser && !selectedUser.is_ghost && !currentUser
        ? t("join.sign_in")
        : t("join.join");

  return (
    <div className="bg-surface text-on-surface flex-1 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-container rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary-container rounded-full blur-[120px]"></div>
      </div>

      <main className="z-10 w-full max-w-sm px-4 flex flex-col items-center py-8">
        <div className="w-24 h-24 bg-surface-container-highest rounded-full flex items-center justify-center mb-6 shadow-sm border border-outline-variant">
          <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            {account.iconKey || account.icon_key || "wallet"}
          </span>
        </div>

        <div className="text-center mb-6 w-full">
          <h1 className="text-2xl font-bold text-on-surface mb-2">{account.name}</h1>
          <p className="text-base text-on-surface-variant">{t("join.invited")}</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col">
            <h2 className="text-xs font-semibold text-outline mb-1 uppercase tracking-wider">{t("join.choose_who")}</h2>
            <p className="text-sm text-on-surface-variant mb-4">{t("join.choose_hint")}</p>
            <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {users.map((user) => {
                const canSelect = user.is_ghost || !currentUser || user.id === currentUser.id;
                const isSelected = selected === user.id;
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      disabled={joining || !canSelect}
                      onClick={() => setSelected(user.id)}
                      className={`w-full flex items-center gap-3 text-left rounded-lg px-3 py-2.5 border transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-outline-variant bg-surface-container-lowest"
                      } ${!canSelect ? "opacity-50 cursor-not-allowed" : "hover:border-primary"}`}
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] ${isSelected ? "text-primary" : "text-outline"}`}
                        style={isSelected ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {isSelected ? "radio_button_checked" : "radio_button_unchecked"}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-base font-semibold text-on-surface truncate">{user.display_name}</span>
                        <span className="block text-xs text-on-surface-variant">
                          {user.is_ghost ? t("join.guest") : t("join.registered")}
                        </span>
                        {!canSelect && (
                          <span className="block text-xs text-outline mt-1">{t("join.already_registered")}</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
              <li>
                <button
                  type="button"
                  disabled={joining}
                  onClick={() => setSelected(NEW_PARTICIPANT)}
                  className={`w-full flex items-center gap-3 text-left rounded-lg px-3 py-2.5 border transition-colors ${
                    selected === NEW_PARTICIPANT
                      ? "border-primary bg-primary/10"
                      : "border-dashed border-primary/60 hover:border-primary"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      selected === NEW_PARTICIPANT ? "text-primary" : "text-secondary"
                    }`}
                  >
                    group_add
                  </span>
                  <span className="flex-1">
                    <span className="block text-base font-semibold text-on-surface">{t("join.new_participant")}</span>
                    <span className="block text-xs text-on-surface-variant">
                      {t("join.you_will_be", { n: users.length + 1 })}
                    </span>
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {selected === NEW_PARTICIPANT && !currentUser && (
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("join.name_placeholder")}
              className="w-full px-4 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              disabled={joining}
            />
          )}

          <button
            type="submit"
            disabled={joining || !selected}
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold text-xl rounded-xl py-4 px-6 transition-colors duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined">login</span>
            {submitLabel}
          </button>
        </form>

        <button
          onClick={() => router.push("/")}
          className="mt-6 text-sm text-outline hover:text-on-surface transition-colors"
          disabled={joining}
        >
          {t("join.cancel")}
        </button>
      </main>
    </div>
  );
}
