"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { getMedialaneClient } from "@/lib/medialane-client";
import { patchCreatorPreferredEncryption } from "@/lib/creator-encryption-preference";

interface WalletData {
  publicKey: string;
  /** How the wallet encryption key was established (PIN vs passkey). */
  preferredEncryption: "PIN" | "PASSKEY";
}

export async function completeOnboarding(walletData: WalletData) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        walletCreated: true,
        // Keep both keys for backward compatibility across old/new readers.
        publicKey: walletData.publicKey,
        walletAddress: walletData.publicKey,
      },
    });

    // Persist wallet address to medialane-backend as deepest fallback layer.
    // Fire-and-forget — don't fail onboarding if this call errors.
    try {
      const token = await getToken({
        template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
      });
      if (token) {
        await getMedialaneClient().api.upsertMyWallet(token);
        await patchCreatorPreferredEncryption(
          walletData.publicKey,
          walletData.preferredEncryption,
          token
        ).catch(() => {});
      }
    } catch {
      // non-fatal: wallet address is still in Clerk publicMetadata
    }

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to complete onboarding" };
  }
}
