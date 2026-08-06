"use client";

import { useCallback, useState } from "react";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import {
  getStoredSiwsToken,
  requestSiwsToken,
  type SiwsSigner,
} from "@/lib/siws-client";

/**
 * Mint + cache a SIWS token for the current wallet, backed by the
 * wallet-native signer's own signTypedData — no PIN/passkey secret needed,
 * unlocking happens implicitly inside the signer's call. Mirrors
 * medialane-starknet's siws-client.ts caching semantics (24h TTL, one prompt
 * per day at most).
 *
 * `getValidToken()` returns a cached, unexpired token or null; call
 * `signIn()` to mint a fresh one when null.
 */
export function useSiwsToken() {
  const { address: walletAddress, signer } = useWalletNativeSession();
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (): Promise<string | null> => {
    if (!walletAddress || !signer) return null;

    const siwsSigner: SiwsSigner = {
      signMessage: (typedData) => signer.signTypedData(typedData),
    };

    setIsSigningIn(true);
    setError(null);
    try {
      const newToken = await requestSiwsToken({ walletAddress, signer: siwsSigner });
      setToken(newToken);
      return newToken;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wallet sign-in failed";
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsSigningIn(false);
    }
  }, [walletAddress, signer]);

  /** Cached, unexpired token if one exists — null otherwise (never prompts). */
  const getValidToken = useCallback((): string | null => {
    if (!walletAddress) return null;
    const existing = getStoredSiwsToken(walletAddress);
    if (existing) setToken(existing);
    return existing;
  }, [walletAddress]);

  return { token, signIn, getValidToken, isSigningIn, error };
}
