"use client";

/**
 * useSessionKey — ChipiPay session key lifecycle + SNIP-12 typed-data signing.
 *
 * Flow:
 *  1. useChipiWallet fetches the user's wallet from ChipiPay (gives normalizedPublicKey + encryptedPrivateKey)
 *  2. setupSession(pin) creates a local SNIP-9 session keypair and registers it on-chain (owner signs once)
 *  3. signTypedData(typedData, pin) decrypts the session key (or falls back to owner key) and signs via starknet.js Account
 *  4. The signature array is passed as calldata to register_order / fulfill_order / cancel_order
 */

import { useCallback, useMemo } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  useChipiWallet,
  useCreateSessionKey,
  useAddSessionKeyToContract,
} from "@chipi-stack/nextjs";
import { Account, RpcProvider, stark } from "starknet";
import CryptoES from "crypto-es";
import { STARKNET_RPC_URL } from "@/lib/constants";
import type { SessionKeyData } from "@chipi-stack/types";

const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });

const SESSION_DURATION_SECONDS = 6 * 60 * 60; // 6 hours
const SESSION_MAX_CALLS = 1000;

export function useSessionKey() {
  const { userId, getToken } = useAuth();
  const { user } = useUser();

  const { createSessionKeyAsync, isLoading: isCreating } = useCreateSessionKey();
  const { addSessionKeyToContractAsync, isLoading: isRegistering } =
    useAddSessionKeyToContract();

  const getBearerToken = useCallback(
    () =>
      getToken({
        template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
      }),
    [getToken]
  );

  // Fetch wallet from ChipiPay API — authoritative source for normalizedPublicKey + encryptedPrivateKey
  const { wallet, isLoadingWallet } = useChipiWallet({
    externalUserId: userId,
    getBearerToken,
    enabled: !!userId,
  });

  // Persisted session from Clerk unsafeMetadata
  const storedSession = useMemo(
    () => (user?.unsafeMetadata?.chipiSession as SessionKeyData | null) ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.unsafeMetadata?.chipiSession]
  );

  const hasActiveSession = useMemo(() => {
    if (!storedSession) return false;
    return storedSession.validUntil * 1000 > Date.now();
  }, [storedSession]);

  /** Starknet contract address for this user's ChipiPay account */
  const walletAddress = wallet?.normalizedPublicKey ?? null;

  // ─── setupSession ─────────────────────────────────────────────────────────

  /**
   * Create a new SNIP-9 session key and register it on-chain.
   * Should be called once (per 6-hour window). User enters PIN once.
   */
  const setupSession = useCallback(
    async (pin: string): Promise<SessionKeyData> => {
      if (!wallet) throw new Error("Wallet not found. Please set up your wallet first.");

      const bearerToken = await getBearerToken();
      if (!bearerToken) throw new Error("Not authenticated. Please sign in again.");

      // 1. Generate local session keypair (encrypted with user's PIN)
      const session = await createSessionKeyAsync({
        encryptKey: pin,
        durationSeconds: SESSION_DURATION_SECONDS,
      });

      // 2. Register the session public key on-chain (owner key signs this)
      await addSessionKeyToContractAsync({
        params: {
          encryptKey: pin,
          wallet,
          sessionConfig: {
            sessionPublicKey: session.publicKey,
            validUntil: session.validUntil,
            maxCalls: SESSION_MAX_CALLS,
            allowedEntrypoints: [], // all entrypoints allowed
          },
        },
        bearerToken,
      });

      // 3. Persist session to Clerk unsafeMetadata for future use
      await user?.update({
        unsafeMetadata: {
          ...(user.unsafeMetadata ?? {}),
          chipiSession: session,
        },
      });

      return session;
    },
    [wallet, getBearerToken, createSessionKeyAsync, addSessionKeyToContractAsync, user]
  );

  // ─── signTypedData ────────────────────────────────────────────────────────

  /**
   * Sign SNIP-12 typed data using the active session key (or owner key as fallback).
   * Returns a normalized string[] signature for use in contract calldata.
   */
  const signTypedData = useCallback(
    async (typedData: unknown, pin: string): Promise<string[]> => {
      if (!walletAddress) {
        throw new Error("Wallet not found. Please set up your wallet first.");
      }

      // Prefer session key if active; fall back to owner key
      let encryptedPk: string | undefined;

      if (hasActiveSession && storedSession?.encryptedPrivateKey) {
        // Session key: short-lived, registered on-chain under the owner contract
        encryptedPk = storedSession.encryptedPrivateKey;
      } else {
        // Owner key: from ChipiPay API (most reliable) or Clerk metadata fallback
        encryptedPk =
          wallet?.encryptedPrivateKey ??
          (user?.unsafeMetadata?.encryptedPrivateKey as string | undefined) ??
          (user?.publicMetadata?.encryptedPrivateKey as string | undefined);
      }

      if (!encryptedPk) {
        throw new Error(
          "No signing key available. Please set up your wallet."
        );
      }

      // Decrypt private key with user's PIN (CryptoES AES — matches ChipiPay's encryption scheme)
      const bytes = CryptoES.AES.decrypt(encryptedPk, pin);
      const privateKey = bytes.toString(CryptoES.enc.Utf8);
      if (!privateKey) {
        throw new Error("Incorrect PIN. Please try again.");
      }

      // Create a starknet.js Account using the decrypted key; sign typed data
      const signingAccount = new Account(provider, walletAddress, privateKey);
      const sig = await signingAccount.signMessage(typedData as any);

      // Normalize Signature (string[] | { r, s }) → string[]
      return stark.formatSignature(sig);
    },
    [walletAddress, hasActiveSession, storedSession, wallet, user]
  );

  // ─── clearSession ─────────────────────────────────────────────────────────

  const clearSession = useCallback(async () => {
    await user?.update({
      unsafeMetadata: {
        ...(user?.unsafeMetadata ?? {}),
        chipiSession: null,
      },
    });
  }, [user]);

  return {
    /** Full wallet object from ChipiPay API */
    wallet,
    /** Starknet contract address (for offerer/fulfiller in orders) */
    walletAddress,
    /** Whether the user has a ChipiPay wallet */
    hasWallet: !!wallet,
    /** Whether a registered, non-expired session key exists */
    hasActiveSession,
    /** Whether wallet data is still loading */
    isLoadingWallet,
    /** Whether a session key is being created or registered on-chain */
    isSettingUpSession: isCreating || isRegistering,
    setupSession,
    signTypedData,
    clearSession,
  };
}
