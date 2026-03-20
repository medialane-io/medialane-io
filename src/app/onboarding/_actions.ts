"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { getMedialaneClient } from "@/lib/medialane-client";

interface WalletData {
  publicKey: string;
}

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

    // Persist wallet address to medialane-backend as deepest fallback layer.
    // Fire-and-forget — don't fail onboarding if this call errors.
    try {
      const token = await getToken({
        template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
      });
      if (token) await getMedialaneClient().api.upsertMyWallet(token);
    } catch {
      // non-fatal: wallet address is still in Clerk publicMetadata
    }

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to complete onboarding" };
  }
}
