"use client";

import { useUser } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const storageKeyForUser = (userId: string) => `ml_chipi_session_unlock:${userId}`;

type ChipiSessionUnlockContextValue = {
  /**
   * PIN or passkey-derived key used to decrypt `SessionKeyData` for `executeWithSession`.
   * Persisted in sessionStorage for the signed-in Clerk user (same browser tab) so refresh
   * does not force re-entry after a successful registration or owner-signed transfer.
   */
  sessionUnlockKey: string | null;
  setSessionUnlockKey: (key: string) => void;
  clearSessionUnlockKey: () => void;
};

const ChipiSessionUnlockContext = createContext<ChipiSessionUnlockContextValue | null>(
  null
);

export function ChipiSessionUnlockProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;

  const [sessionUnlockKey, setKeyState] = useState<string | null>(null);
  const lastHydratedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded) return;

    if (!userId) {
      const previous = lastHydratedUserIdRef.current;
      if (previous) {
        sessionStorage.removeItem(storageKeyForUser(previous));
      }
      lastHydratedUserIdRef.current = null;
      setKeyState(null);
      return;
    }

    if (lastHydratedUserIdRef.current !== userId) {
      lastHydratedUserIdRef.current = userId;
      const stored = sessionStorage.getItem(storageKeyForUser(userId));
      setKeyState(stored);
    }
  }, [userId, isLoaded]);

  const setSessionUnlockKey = useCallback(
    (key: string) => {
      setKeyState(key);
      if (userId && typeof window !== "undefined") {
        sessionStorage.setItem(storageKeyForUser(userId), key);
      }
    },
    [userId]
  );

  const clearSessionUnlockKey = useCallback(() => {
    setKeyState(null);
    if (userId && typeof window !== "undefined") {
      sessionStorage.removeItem(storageKeyForUser(userId));
    }
  }, [userId]);

  const value = useMemo(
    () => ({
      sessionUnlockKey,
      setSessionUnlockKey,
      clearSessionUnlockKey,
    }),
    [sessionUnlockKey, setSessionUnlockKey, clearSessionUnlockKey]
  );

  return (
    <ChipiSessionUnlockContext.Provider value={value}>
      {children}
    </ChipiSessionUnlockContext.Provider>
  );
}

export function useChipiSessionUnlock() {
  const ctx = useContext(ChipiSessionUnlockContext);
  if (!ctx) {
    throw new Error("useChipiSessionUnlock must be used within ChipiSessionUnlockProvider");
  }
  return ctx;
}
