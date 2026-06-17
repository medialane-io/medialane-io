"use client";

import { usePasskeyCredentialSync } from "@/hooks/use-passkey-credential-sync";

/**
 * Mount once in the app shell. Mirrors the passkey credential handle between
 * this device's localStorage and Clerk so a synced passkey can unlock the
 * wallet on any device. Renders nothing.
 */
export function PasskeyCredentialSync() {
  usePasskeyCredentialSync();
  return null;
}
