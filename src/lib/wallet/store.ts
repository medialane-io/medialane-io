import type { SealedOwner } from "./passkey";

const STORE_KEY = "medialane-io.wallet.owner.v1";
const EVENT = "mlio-wallet";

export function loadSealedOwner(): SealedOwner | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as SealedOwner) : null;
  } catch {
    return null;
  }
}

export function loadWalletAddress(): string | null {
  return loadSealedOwner()?.address ?? null;
}

export function saveSealedOwner(sealed: SealedOwner): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(sealed));
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Notify listeners (useWalletNativeSession's isDeployed check, in
 * particular) that on-chain state changed without the local key itself
 * changing — e.g. right after a deploy succeeds. Without this, isDeployed
 * stays stuck at whatever it was on last mount/wallet-change, since
 * checkIsDeployed() only re-runs on that event.
 */
export function notifyWalletChange(): void {
  window.dispatchEvent(new Event(EVENT));
}

export function clearSealedOwner(): void {
  localStorage.removeItem(STORE_KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function onWalletChange(fn: () => void): () => void {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}
