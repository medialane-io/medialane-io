"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

interface WalletData {
  publicKey: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL || "http://localhost:3001";

export async function completeOnboarding(walletData: WalletData) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        walletCreated: true,
        publicKey: walletData.publicKey,
      },
    });

    // Register wallet in Medialane user registry. Fire-and-forget.
    try {
      const token = await getToken({
        template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
      });
      if (token) {
        await fetch(`${BACKEND_URL}/v1/users/me`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            walletType: "CHIPIPAY",
            appSource: "MEDIALANE_IO",
          }),
        });
      }
    } catch {
      // non-fatal: wallet address is still in Clerk publicMetadata
    }

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to complete onboarding" };
  }
}
