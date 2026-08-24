import { typedData as starknetTypedData, type Call, type TypedData } from "starknet";
import { signWith, signWithPrivateKey, type SealedOwner } from "./passkey";
import { throwOnErrorResponse } from "@/lib/fetch-error";

export class SponsorUnavailableError extends Error {}

export async function executeSponsored(
  sealed: SealedOwner,
  calls: Call[],
  userAddress: string = sealed.address,
  unlockedPrivateKey?: string,
): Promise<{ transactionHash: string }> {
  const buildRes = await fetch("/api/wallet/sponsored-invoke/build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userAddress, calls }),
  });
  if (!buildRes.ok) {
    const body = (await buildRes.json().catch(() => null)) as { error?: string } | null;
    throw new SponsorUnavailableError(body?.error || "We couldn't prepare this transaction. Please try again.");
  }
  const { typedData } = (await buildRes.json()) as { typedData: TypedData };

  const msgHash = starknetTypedData.getMessageHash(typedData, userAddress);
  const signature = unlockedPrivateKey
    ? signWithPrivateKey(unlockedPrivateKey, msgHash)
    : await signWith(sealed, msgHash);

  const executeRes = await fetch("/api/wallet/sponsored-invoke/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userAddress, typedData, signature, calls }),
  });
  if (!executeRes.ok) await throwOnErrorResponse(executeRes, "We couldn't submit this transaction. Please try again.");
  const { transactionHash } = (await executeRes.json()) as { transactionHash: string };
  return { transactionHash };
}
