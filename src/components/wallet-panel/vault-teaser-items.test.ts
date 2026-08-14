import { test, expect } from "bun:test";
import { pickVaultTeaserItems } from "./vault-teaser-items";
import type { ApiToken } from "@medialane/sdk";

function makeToken(overrides: Partial<ApiToken> = {}): ApiToken {
  return {
    id: "1",
    chain: "starknet",
    contractAddress: "0xabc",
    tokenId: "1",
    owner: "0xowner",
    tokenUri: null,
    metadataStatus: "FETCHED",
    standard: "ERC721",
    metadata: {
      name: "Test Asset",
      description: null,
      image: "ipfs://image",
      animationUrl: null,
      attributes: null,
      ipType: "Art",
      licenseType: null,
      commercialUse: null,
      derivatives: null,
      attribution: null,
      territory: null,
      aiPolicy: null,
      royalty: null,
      registration: null,
      author: null,
    },
    balances: null,
    activeOrders: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  } as ApiToken;
}

test("maps a token to a teaser item with an asset-page href", () => {
  const items = pickVaultTeaserItems([makeToken()], 6);
  expect(items).toEqual([
    {
      key: "0xabc-1",
      href: "/asset/starknet/0xabc/1",
      name: "Test Asset",
      image: "ipfs://image",
      ipType: "Art",
      fallbackId: "1",
    },
  ]);
});

test("falls back to a numbered name when metadata.name is missing", () => {
  const token = makeToken({
    tokenId: "42",
    metadata: { ...makeToken().metadata, name: null },
  });
  const [item] = pickVaultTeaserItems([token], 6);
  expect(item.name).toBe("#42");
});

test("caps results at the given limit", () => {
  const tokens = Array.from({ length: 10 }, (_, i) =>
    makeToken({ tokenId: String(i), contractAddress: `0xcontract${i}` })
  );
  expect(pickVaultTeaserItems(tokens, 4)).toHaveLength(4);
});

test("returns an empty array for no tokens", () => {
  expect(pickVaultTeaserItems([], 6)).toEqual([]);
});
