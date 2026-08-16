import { typedData as starknetTypedData, type Call, type TypedData } from "starknet";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import { signWithPrivateKey, unlockOwnerKey, type SealedOwner } from "./passkey";
import { executeSponsored } from "./sponsored-invoke";

/**
 * Keyed by wallet address rather than held in the signer instance's own
 * closure, since `signer` objects are memoized (stable across renders) — an
 * in-closure cache would otherwise keep the decrypted key alive for the
 * whole session. Self-expiring (UNLOCK_TTL_MS) rather than relying on every
 * call site to remember to call `lockVenueSigner`: the signer is a plain
 * object handed to many independent hooks (marketplace actions, transfers,
 * SIWS sign-in, mint/claim flows, …), and a cache that only clears on
 * caller cooperation is one missed call away from a decrypted key sitting
 * in memory indefinitely. The TTL just needs to comfortably outlast one
 * action's round trips (build → passkey prompt → submit); `lockVenueSigner`
 * on top lets latency-sensitive callers (useWalletWriteAction) clear it
 * immediately once their action settles instead of waiting out the TTL.
 */
const UNLOCK_TTL_MS = 20_000;
const unlockCache = new Map<string, { promise: Promise<string>; timer: ReturnType<typeof setTimeout> }>();

/** Drops the cached decrypted key for a wallet. Safe to call any time, including redundantly. */
export function lockVenueSigner(address: string): void {
  const entry = unlockCache.get(address);
  if (!entry) return;
  clearTimeout(entry.timer);
  unlockCache.delete(address);
}

function unlockOnce(sealed: SealedOwner): Promise<string> {
  const existing = unlockCache.get(sealed.address);
  if (existing) return existing.promise;

  const promise = unlockOwnerKey(sealed).catch((err) => {
    lockVenueSigner(sealed.address);
    throw err;
  });
  const timer = setTimeout(() => lockVenueSigner(sealed.address), UNLOCK_TTL_MS);
  unlockCache.set(sealed.address, { promise, timer });
  return promise;
}

/**
 * One passkey unlock per action (not per instance — `signer` is memoized and
 * long-lived), reused across every sign call made for that action (e.g. the
 * order signature + the sponsored-invoke signature for a single marketplace
 * action) so the user isn't prompted for their passkey more than once per
 * action. See `lockVenueSigner`.
 */
export function starknetVenueSigner(sealed: SealedOwner): StarknetVenueSigner {
  return {
    address: sealed.address,
    signTypedData: async (data: TypedData) => {
      const priv = await unlockOnce(sealed);
      return signWithPrivateKey(priv, starknetTypedData.getMessageHash(data, sealed.address));
    },
    execute: async (calls: Call[]) => {
      const priv = await unlockOnce(sealed);
      const result = await executeSponsored(sealed, calls, sealed.address, priv);
      return { txHash: result.transactionHash };
    },
  };
}
