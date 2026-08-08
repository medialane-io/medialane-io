import { typedData as starknetTypedData, type Call, type TypedData } from "starknet";
import { signWith, type SealedOwner } from "./passkey";

/**
 * Executes calls against an already-deployed MediaWallet account via AVNU's
 * sponsored paymaster — the post-deploy sibling of `deployWalletSponsored`
 * (see design spec 2026-08-08-io-sponsored-invoke-design.md). Two round-trips
 * to io's own API routes (never AVNU directly — the API key stays
 * server-side) bracket one local signature: build the sponsored invoke
 * transaction, sign the returned SNIP-9 outside-execution typed data with the
 * passkey-derived key, execute it.
 */
export async function executeSponsored(sealed: SealedOwner, calls: Call[]): Promise<{ transactionHash: string }> {
  const buildRes = await fetch("/api/wallet/sponsored-invoke/build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userAddress: sealed.address, calls }),
  });
  if (!buildRes.ok) throw new Error(`Sponsored invoke build failed (${buildRes.status})`);
  const { typedData } = (await buildRes.json()) as { typedData: TypedData };

  const signature = await signWith(sealed, starknetTypedData.getMessageHash(typedData, sealed.address));

  const executeRes = await fetch("/api/wallet/sponsored-invoke/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userAddress: sealed.address, typedData, signature }),
  });
  if (!executeRes.ok) throw new Error(`Sponsored invoke execute failed (${executeRes.status})`);
  const { transactionHash } = (await executeRes.json()) as { transactionHash: string };
  return { transactionHash };
}
