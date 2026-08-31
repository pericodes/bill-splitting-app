"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = {
  id: string;
  display_name: string;
  is_ghost: boolean;
  session_secret?: string;
};

interface AppState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),
    }),
    {
      name: "equilibrium-storage",
    }
  )
);

export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persistApi = useStore.persist;
    const finish = () => setHydrated(true);

    if (!persistApi?.onFinishHydration) {
      finish();
      return;
    }

    const unsub = persistApi.onFinishHydration(finish);
    if (persistApi.hasHydrated()) finish();

    return unsub;
  }, []);

  return hydrated;
}
