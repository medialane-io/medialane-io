"use client";

import { useUser } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const UNLOCK_TTL_MS = 10 * 60 * 1000;

type ChipiSessionUnlockContextValue = {
  /**
   * Ephemeral in-memory unlock key (PIN or passkey-derived key) used for
   * executeWithSession flows. Never persisted to local/session storage.
   */
  sessionUnlockKey: string | null;
  setSessionUnlockKey: (key: string) => void;
  clearSessionUnlockKey: () => void;
};

const ChipiSessionUnlockContext =
  createContext<ChipiSessionUnlockContextValue | null>(null);

export function ChipiSessionUnlockProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;

  const [sessionUnlockKey, setSessionUnlockKeyState] = useState<string | null>(null);
  const [sessionUnlockSetAt, setSessionUnlockSetAt] = useState<number | null>(null);

  // Clear in-memory unlock state on auth identity changes.
  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      setSessionUnlockKeyState(null);
      setSessionUnlockSetAt(null);
    }
  }, [userId, isLoaded]);

  // Auto-expire in-memory key after a short TTL.
  useEffect(() => {
    if (!sessionUnlockSetAt) return;
    const msLeft = Math.max(UNLOCK_TTL_MS - (Date.now() - sessionUnlockSetAt), 0);
    if (msLeft === 0) {
      setSessionUnlockKeyState(null);
      setSessionUnlockSetAt(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setSessionUnlockKeyState(null);
      setSessionUnlockSetAt(null);
    }, msLeft);
    return () => window.clearTimeout(timer);
  }, [sessionUnlockSetAt]);

  const setSessionUnlockKey = useCallback((key: string) => {
    setSessionUnlockKeyState(key);
    setSessionUnlockSetAt(Date.now());
  }, []);

  const clearSessionUnlockKey = useCallback(() => {
    setSessionUnlockKeyState(null);
    setSessionUnlockSetAt(null);
  }, []);

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

