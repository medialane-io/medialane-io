"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { getMedialaneClient } from "@/lib/medialane-client";
import { RpcProvider, Account, CallData, byteArray } from "starknet";

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

/**
 * Mint the genesis NFT to a recipient address using the contract owner's key.
 * mint_item is owner-only — users cannot call it directly.
 *
 * Required server-side env vars:
 *   GENESIS_ADMIN_ADDRESS  — contract owner address (0x66b34340...)
 *   GENESIS_ADMIN_PRIVATE_KEY — contract owner private key
 *   NEXT_PUBLIC_LAUNCH_MINT_CONTRACT — genesis NFT contract address
 *   NEXT_PUBLIC_GENESIS_NFT_URI — token URI (bare CID or ipfs://...)
 *   NEXT_PUBLIC_STARKNET_RPC_URL — Starknet RPC endpoint
 */
export async function mintGenesisNFT(recipientAddress: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const adminAddress = process.env.GENESIS_ADMIN_ADDRESS;
    const adminPrivateKey = process.env.GENESIS_ADMIN_PRIVATE_KEY;
    const contractAddress = process.env.NEXT_PUBLIC_LAUNCH_MINT_CONTRACT;
    const rpcUrl = process.env.NEXT_PUBLIC_STARKNET_RPC_URL;
    let tokenUri = process.env.NEXT_PUBLIC_GENESIS_NFT_URI || "";

    if (!adminAddress || !adminPrivateKey) return { error: "Mint not configured" };
    if (!contractAddress) return { error: "Mint contract not configured" };
    if (!tokenUri) return { error: "Token URI not configured" };

    // Ensure ipfs:// prefix
    if (!tokenUri.startsWith("ipfs://") && !tokenUri.startsWith("http")) {
      tokenUri = `ipfs://${tokenUri}`;
    }

    const provider = new RpcProvider({ nodeUrl: rpcUrl || "" });
    const adminAccount = new Account(provider, adminAddress, adminPrivateKey);

    // Skip if already minted (balance_of check)
    try {
      const balance = await provider.callContract(
        { contractAddress, entrypoint: "balance_of", calldata: [recipientAddress] },
        "latest"
      );
      if (BigInt(balance[0]) > 0n) {
        return { alreadyMinted: true };
      }
    } catch {
      // Non-fatal: proceed with mint attempt
    }

    const encodedUri = byteArray.byteArrayFromString(tokenUri);
    const calldata = CallData.compile([recipientAddress, encodedUri]);

    const result = await adminAccount.execute({
      contractAddress,
      entrypoint: "mint_item",
      calldata,
    });

    return { txHash: result.transaction_hash };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Mint failed" };
  }
}
