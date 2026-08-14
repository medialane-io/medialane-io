import { hash } from "starknet";
import { starknetProvider } from "@/lib/starknet";

export async function readAssignedEditionId(txHash: string, collection: string): Promise<string> {
  const receipt = await starknetProvider.getTransactionReceipt(txHash);
  const selector = hash.getSelectorFromName("IPMinted");
  const events =
    (receipt as unknown as { events?: Array<{ from_address: string; keys: string[] }> }).events ?? [];
  const ev = events.find(
    (e) =>
      BigInt(e.from_address) === BigInt(collection) &&
      e.keys?.[0] != null &&
      BigInt(e.keys[0]) === BigInt(selector),
  );
  if (!ev) throw new Error("Minted, but could not read the assigned token id from the receipt");
  const low = BigInt(ev.keys[1] ?? 0);
  const high = BigInt(ev.keys[2] ?? 0);
  return (low + (high << 128n)).toString();
}
