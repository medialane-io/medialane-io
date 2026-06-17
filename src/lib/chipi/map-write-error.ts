import { looksLikeEncryptionFailure } from "./looks-like-encryption-failure";

const AUTH_NEUTRAL_UNLOCK_MSG =
  "We couldn't unlock your wallet. Make sure you're using the unlock method you chose when you created it — your PIN, or Face ID / Touch ID — then try again.";

const SESSION_MSG =
  "We couldn't authorise this transaction with the network. Tap Try again — " +
  "if it keeps failing, refresh your wallet session in Portfolio → Wallet " +
  '(toggle "Remember session" off and back on), then retry.';

/**
 * Single source of truth for write-error → user-facing message + recovery hint.
 *
 * - `authHint` true ⇒ a wrong PIN/passkey unlock ⇒ show the passkey/PIN recovery hint.
 *   A wrong unlock secret surfaces from ChipiPay's `decryptPrivateKey` as EITHER
 *   "Decryption resulted in empty string" or "Malformed UTF-8 data" (neither contains
 *   the words `looksLikeEncryptionFailure` historically matched).
 * - `isSessionMismatch` true ⇒ paymaster/session-whitelist revert ⇒ suggest a session refresh.
 *
 * Messages are **auth-neutral**: a wallet unlocks with a PIN *or* a passkey, never both,
 * so we never assert "wrong PIN".
 */
export function mapWriteError(raw: string): {
  message: string;
  authHint: boolean;
  isSessionMismatch: boolean;
} {
  if (/Malformed UTF-8 data|Decryption resulted in empty string|Could not unlock wallet/i.test(raw)) {
    return { message: AUTH_NEUTRAL_UNLOCK_MSG, authHint: true, isSessionMismatch: false };
  }
  if (/prepare.{0,3}typed.{0,3}data/i.test(raw) && /TRANSACTION_EXECUTION_ERROR|Paymaster\s+error/i.test(raw)) {
    return { message: SESSION_MSG, authHint: false, isSessionMismatch: true };
  }
  // Fallback: keep the raw message, but still flag auth failures so the hint can show.
  return { message: raw, authHint: looksLikeEncryptionFailure(raw), isSessionMismatch: false };
}
