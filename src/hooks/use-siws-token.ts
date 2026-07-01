"use client";

import { useCallback, useState } from "react";
import { useSessionKey } from "@/hooks/use-session-key";
import {
  getStoredSiwsToken,
  requestSiwsToken,
  type SiwsSigner,
} from "@/lib/siws-client";

/**
 * Mint + cache a SIWS token for the current wallet, backed by io's existing
 * ChipiPay signTypedData. Unlike medialane-starknet's useSiwsToken (whose
 * wallets sign without a secret), io's signer needs a `secret` (PIN or
 * passkey encryptKey) already resolved by the caller via the existing
 * useWalletUnlock pipeline — this hook never prompts for one itself.
 *
 * `getValidToken()` returns a cached, unexpired token or null; call `signIn(secret)`
 * to mint a fresh one when null. Mirrors medialane-starknet's siws-client.ts
 * caching semantics (24h TTL, one prompt per day at most).
 */
export function useSiwsToken() {
  const { walletAddress, signTypedData } = useSessionKey();
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(
    async (secret: string): Promise<string | null> => {
      if (!walletAddress) return null;

      const signer: SiwsSigner = {
        signMessage: (typedData) => signTypedData(typedData, secret),
      };

      setIsSigningIn(true);
      setError(null);
      try {
        const newToken = await requestSiwsToken({ walletAddress, signer });
        setToken(newToken);
        return newToken;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Wallet sign-in failed";
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setIsSigningIn(false);
      }
    },
    [walletAddress, signTypedData]
  );

  /** Cached, unexpired token if one exists — null otherwise (never prompts). */
  const getValidToken = useCallback((): string | null => {
    if (!walletAddress) return null;
    const existing = getStoredSiwsToken(walletAddress);
    if (existing) setToken(existing);
    return existing;
  }, [walletAddress]);

  return { token, signIn, getValidToken, isSigningIn, error };
}
