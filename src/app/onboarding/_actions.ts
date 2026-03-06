"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

interface WalletData {
  publicKey: string;
  encryptedPrivateKey: string;
}

export async function completeOnboarding(walletData: WalletData) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        walletCreated: true,
        publicKey: walletData.publicKey,
        encryptedPrivateKey: walletData.encryptedPrivateKey,
      },
    });

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to complete onboarding" };
  }
}
