"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

interface WalletData {
  publicKey: string;
  walletAuthMethod?: "pin" | "passkey";
}

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL || "http://localhost:3001";

export async function completeOnboarding(walletData: WalletData) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const client = await clerkClient();
    // Preserve a previously-recorded auth method if the caller doesn't pass one.
    const existing = await client.users.getUser(userId);
    const existingAuthMethod =
      (existing.publicMetadata as { walletAuthMethod?: "pin" | "passkey" })?.walletAuthMethod;

    await client.users.updateUser(userId, {
      publicMetadata: {
        walletCreated: true,
        publicKey: walletData.publicKey,
        walletAuthMethod: walletData.walletAuthMethod ?? existingAuthMethod,
      },
    });

    // Register wallet in Medialane user registry — deliberately redundant
    // with <AccountSyncOnLogin /> in providers.tsx. The client component
    // covers returning sessions; this server-side write covers the case
    // where the user closes the tab between this action returning and the
    // client component effect running. Both are idempotent on the backend
    // (ensureAccountForWallet upserts on the existing wallet row).
    try {
      const token = await getToken({
        template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
      });
      if (token) {
        const res = await fetch(`${BACKEND_URL}/v1/users/me`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            walletType: "CHIPIPAY",
            appSource: "MEDIALANE_IO",
            chain: "STARKNET",
          }),
        });
        if (!res.ok) {
          console.error("[ml-register] failed", {
            appSource: "MEDIALANE_IO",
            walletType: "CHIPIPAY",
            source: "onboarding-action",
            status: res.status,
          });
        }
      }
    } catch (error) {
      // non-fatal: wallet address is still in Clerk publicMetadata, and
      // AccountSyncOnLogin will retry on the next session. Log so the
      // failure is visible in server logs instead of vanishing.
      console.error("[ml-register] failed", {
        appSource: "MEDIALANE_IO",
        walletType: "CHIPIPAY",
        source: "onboarding-action",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to complete onboarding" };
  }
}
