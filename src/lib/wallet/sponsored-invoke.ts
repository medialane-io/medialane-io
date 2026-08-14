import { typedData as starknetTypedData, type Call, type TypedData } from "starknet";
import { signWith, type SealedOwner } from "./passkey";

export async function executeSponsored(
  sealed: SealedOwner,
  calls: Call[],
  userAddress: string = sealed.address,
): Promise<{ transactionHash: string }> {
  const buildRes = await fetch("/api/wallet/sponsored-invoke/build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userAddress, calls }),
  });
  if (!buildRes.ok) throw new Error(`Sponsored invoke build failed (${buildRes.status})`);
  const { typedData } = (await buildRes.json()) as { typedData: TypedData };

  const signature = await signWith(sealed, starknetTypedData.getMessageHash(typedData, userAddress));

  const executeRes = await fetch("/api/wallet/sponsored-invoke/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userAddress, typedData, signature }),
  });
  if (!executeRes.ok) throw new Error(`Sponsored invoke execute failed (${executeRes.status})`);
  const { transactionHash } = (await executeRes.json()) as { transactionHash: string };
  return { transactionHash };
}
