import { typedData as starknetTypedData, type Call, type TypedData } from "starknet";
import { signWith, signWithPrivateKey, type SealedOwner } from "./passkey";
import { throwOnErrorResponse } from "@/lib/fetch-error";

export class SponsorUnavailableError extends Error {}

// Statuses paymaster.ts's /invoke/execute can only return before it ever
// calls AVNU's executeTransaction (body/typedData validation, the account
// rate limit, the entrypoint + contract-address allowlists) or from
// defaultClient() throwing on a missing AVNU key — both happen before
// .executeTransaction() is reached. Nothing could have broadcast, so it's
// safe to retry self-funded. Anything else (422 simulation rejection, 502
// "temporarily unavailable") either means the call itself would fail
// regardless of payer, or genuinely might have already broadcast — stays a
// hard error.
const PRE_BROADCAST_EXECUTE_STATUSES = new Set([400, 429, 503]);

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
  if (!executeRes.ok) {
    if (PRE_BROADCAST_EXECUTE_STATUSES.has(executeRes.status)) {
      const body = (await executeRes.json().catch(() => null)) as { error?: string } | null;
      throw new SponsorUnavailableError(body?.error || "We couldn't submit this transaction. Please try again.");
    }
    await throwOnErrorResponse(executeRes, "We couldn't submit this transaction. Please try again.");
  }
  const { transactionHash } = (await executeRes.json()) as { transactionHash: string };
  return { transactionHash };
}
