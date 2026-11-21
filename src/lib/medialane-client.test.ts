import { expect, test } from "bun:test";
import { resolveConfig } from "@medialane/sdk";
import { buildIntent, type Call } from "@medialane/sdk/starknet";
import { medialaneConfig, purchaseTotal } from "./medialane-client";

test("io's purchases carry the platform fee", () => {
  expect(medialaneConfig().feeConfig).toEqual({ enabled: true });
});

const USDC = "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb";
const NFT = "0x036785cc48859b3abe4770b409ec224ef3fee4fefb2bc2c8235e8f2aae58d14e";

function paidBy(calls: readonly Call[]): bigint {
  return calls
    .filter((c) => c.contractAddress === USDC && (c.entrypoint === "approve" || c.entrypoint === "transfer"))
    .reduce((sum, c) => {
      const data = (c.calldata as string[]).map(String);
      return sum + BigInt(data[1]!) + (BigInt(data[2]!) << 128n);
    }, 0n);
}

test("the purchase total is what the purchase spends: the price plus the platform fee", () => {
  const price = 10_000n;
  const order = {
    offer: { itemType: "ERC721", token: NFT, identifier: "1" },
    consideration: { itemType: "ERC20", token: USDC, startAmount: price.toString() },
  };
  const { calls } = buildIntent(
    "fulfill",
    { fulfiller: "0x1", orderHash: "0x2" },
    { order, is1155: false },
    resolveConfig(medialaneConfig()),
  );
  expect(purchaseTotal(price)).toBe(paidBy(calls));
  expect(purchaseTotal(price)).toBeGreaterThan(price);
});
