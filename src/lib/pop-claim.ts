import { collectionHref } from "@medialane/sdk";
import { encodePopClaimFragment, verifyPopProof, type PopAllowlist } from "@medialane/sdk/starknet";

export interface ClaimLink {
  address: string;
  url: string;
}

/** One claim link per address in the allowlist: the collection page with the proof in its fragment. */
export function claimLinks(origin: string, contract: string, list: PopAllowlist): ClaimLink[] {
  const base = `${origin}${collectionHref("STARKNET", contract)}`;
  return Object.entries(list.proofs).map(([address, proof]) => ({
    address,
    url: `${base}${encodePopClaimFragment(proof)}`,
  }));
}

export function claimLinksCsv(links: ClaimLink[]): string {
  return ["address,claim_link", ...links.map((l) => `${l.address},${l.url}`)].join("\n");
}

export type PopClaimState = "loading" | "claimed" | "no-link" | "wrong-wallet" | "ready";

export function popClaimState(input: {
  hasClaimed: boolean | null;
  proof: string[] | null;
  root: string | null;
  wallet: string | null;
}): PopClaimState {
  if (input.hasClaimed === true) return "claimed";
  if (input.hasClaimed === null || input.root === null) return "loading";
  if (input.proof === null) return "no-link";
  if (!input.wallet || !verifyPopProof(input.root, input.wallet, input.proof)) return "wrong-wallet";
  return "ready";
}
