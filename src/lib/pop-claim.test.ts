import { describe, expect, test } from "bun:test";
import { buildPopAllowlist } from "@medialane/sdk/starknet";
import { claimLinks, claimLinksCsv, popClaimState } from "./pop-claim";

const COLLECTION = "0x0abc";
const list = buildPopAllowlist(["0x111", "0x222"]);
const pad = (a: string) => "0x" + a.slice(2).padStart(64, "0");

describe("claim links", () => {
  test("one link per participant, to the collection page with the proof in the fragment", () => {
    const links = claimLinks("https://medialane.io", COLLECTION, list);
    expect(links.map((l) => l.address).sort()).toEqual([pad("0x111"), pad("0x222")]);
    for (const link of links) {
      expect(link.url.startsWith("https://medialane.io/collections/")).toBe(true);
      expect(link.url).toContain("#pop-proof=");
    }
  });

  test("the CSV has a header and one row per link", () => {
    const csv = claimLinksCsv(claimLinks("https://medialane.io", COLLECTION, list));
    const rows = csv.split("\n");
    expect(rows[0]).toBe("address,claim_link");
    expect(rows).toHaveLength(3);
  });
});

describe("claim state", () => {
  const root = list.root;
  const proof = list.proofs[pad("0x111")]!;

  test("waits while the claim status or root is loading", () => {
    expect(popClaimState({ hasClaimed: null, proof, root, wallet: "0x111" })).toBe("loading");
    expect(popClaimState({ hasClaimed: false, proof, root: null, wallet: "0x111" })).toBe("loading");
  });

  test("a holder sees that they hold it", () => {
    expect(popClaimState({ hasClaimed: true, proof: null, root, wallet: "0x111" })).toBe("claimed");
  });

  test("without a claim link there is nothing to claim with", () => {
    expect(popClaimState({ hasClaimed: false, proof: null, root, wallet: "0x111" })).toBe("no-link");
  });

  test("with no published list, claims are closed rather than blamed on the wallet", () => {
    expect(popClaimState({ hasClaimed: false, proof, root: "0x0", wallet: "0x111" })).toBe("closed");
  });

  test("a link opened by another wallet is refused before any transaction", () => {
    expect(popClaimState({ hasClaimed: false, proof, root, wallet: "0x999" })).toBe("wrong-wallet");
  });

  test("the listed wallet with its link can claim", () => {
    expect(popClaimState({ hasClaimed: false, proof, root, wallet: "0x111" })).toBe("ready");
  });
});
