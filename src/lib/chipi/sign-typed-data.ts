/**
 * Pure SNIP-12 typed-data signing with a ChipiPay wallet, given an explicit
 * wallet object and secret — no hook state, no dependency on useSessionKey's
 * separately-fetched `wallet` (which can lag one render behind a
 * just-created wallet; see the "Do not attempt auto-progression" note in
 * CLAUDE.md). Extracted from use-session-key.ts's signTypedData so callers
 * that already hold a fresh wallet object (e.g. onboarding, right after
 * createWallet resolves) can sign without waiting on that separate fetch.
 *
 * `use-session-key.ts`'s `signTypedData` delegates to this — keep the two
 * in sync; this is the single implementation.
 */
import { Account, stark, type TypedData } from "starknet";
// crypto-es: must match ChipiPay's AES encryption scheme — do not swap to Web Crypto without coordinating with ChipiPay
import CryptoES from "crypto-es";
import { starknetProvider } from "@/lib/starknet";

export interface SignableWallet {
  normalizedPublicKey?: string;
  publicKey?: string;
  encryptedPrivateKey?: string;
}

/**
 * Decrypt `wallet.encryptedPrivateKey` with `secret` (PIN or passkey-derived
 * encryptKey — identical downstream), build a starknet.js Account, and sign
 * `typedData`. Returns a normalized `string[]` signature.
 */
export async function signTypedDataWithWallet(
  wallet: SignableWallet,
  secret: string,
  typedData: unknown
): Promise<string[]> {
  const walletAddress = wallet.normalizedPublicKey ?? wallet.publicKey;
  if (!walletAddress) {
    throw new Error("Wallet not found. Please set up your wallet first.");
  }
  if (!wallet.encryptedPrivateKey) {
    throw new Error("No signing key available. Please set up your wallet.");
  }

  const bytes = CryptoES.AES.decrypt(wallet.encryptedPrivateKey, secret);
  const privateKey = bytes.toString(CryptoES.enc.Utf8);
  if (!privateKey) {
    throw new Error("Incorrect PIN. Please try again.");
  }

  const signingAccount = new Account(starknetProvider, walletAddress, privateKey);
  const sig = await signingAccount.signMessage(typedData as TypedData);
  return stark.formatSignature(sig);
}
