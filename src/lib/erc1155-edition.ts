import { hash } from "starknet";
import { starknetProvider } from "@/lib/starknet";

/**
 * Reads the on-chain-assigned edition id from the `IPMinted` event of a
 * `mint_edition` transaction (v0.3.0 ERC-1155 collections assign ids
 * sequentially on-chain). The event's keys are
 * `[selector, token_id_low, token_id_high, recipient]` — token_id is a u256 key.
 */
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
