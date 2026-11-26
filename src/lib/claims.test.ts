import { describe, expect, test } from "bun:test";
import { LAUNCHPAD_ROUTE_OVERRIDES, LAUNCHPAD_SERVICE_DEFINITIONS } from "@medialane/ui";
import { AIRDROP_CLAIM, SHARED_CLAIM_KEYS, claimDefinitions, claimOverrides } from "./claims";

const cards = claimDefinitions(LAUNCHPAD_SERVICE_DEFINITIONS);
const overrides = claimOverrides(LAUNCHPAD_ROUTE_OVERRIDES);

describe("the cards on the claims page", () => {
  test("are the airdrop plus every claim the launchpad used to show", () => {
    expect(cards.map((c) => c.key)).toEqual([
      "claim-airdrop",
      "claim-username",
      "claim-collection",
      "claim-collection-name",
      "claim-memecoin",
    ]);
  });

  test("are all live and have a page to open", () => {
    for (const card of cards) {
      expect(card.status).toBe("live");
      expect(overrides[card.key]?.href).toBeTruthy();
    }
  });

  test("all share the claims group, so every card has the same colour, including the memecoin claim", () => {
    expect(cards.every((c) => c.group === "claims")).toBe(true);
  });

  test("the memecoin claim lives with the other claims", () => {
    expect(overrides["claim-memecoin"]?.href).toBe("/claim/memecoin");
  });

  test("the airdrop card opens the airdrop page", () => {
    expect(overrides[AIRDROP_CLAIM.key]?.href).toBe("/airdrop");
  });

  test("the airdrop card looks like the others: same group, a call to action", () => {
    expect(AIRDROP_CLAIM.group).toBe("claims");
    expect(AIRDROP_CLAIM.cta).toBeTruthy();
  });
});

describe("the claims the launchpad stops showing", () => {
  test("all still exist in the shared service list, so a rename in the shared package fails here", () => {
    for (const key of SHARED_CLAIM_KEYS) {
      expect(LAUNCHPAD_SERVICE_DEFINITIONS.some((d) => d.key === key)).toBe(true);
    }
  });

  test("do not include the airdrop, which is not a launchpad service", () => {
    expect(SHARED_CLAIM_KEYS as readonly string[]).not.toContain(AIRDROP_CLAIM.key);
  });
});
