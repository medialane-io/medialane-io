import { test, expect } from "bun:test";
import type { ApiActivity, ApiOrder } from "@medialane/sdk";
import { cheapestOf, latestSale, formatSale, isSaleableListing, isBid, listedQuantityBy, hasUnlistedEditions } from "./use-asset-market-state";

function order(over: Partial<ApiOrder> & { amount: string }): ApiOrder {
  const { amount, ...rest } = over;
  return {
    status: "ACTIVE",
    offer: { itemType: "ERC721" },
    consideration: { startAmount: amount },
    ...rest,
  } as unknown as ApiOrder;
}

test("cheapest compares numerically, not as strings", () => {
  // "1000000000000000000" < "9" lexicographically, which is the trap here.
  const listings = [order({ amount: "9" }), order({ amount: "1000000000000000000" })];
  expect(cheapestOf(listings)?.consideration.startAmount).toBe("9");
});

test("cheapest handles amounts beyond Number.MAX_SAFE_INTEGER", () => {
  const listings = [
    order({ amount: "9007199254740993000000" }),
    order({ amount: "9007199254740992000000" }),
  ];
  expect(cheapestOf(listings)?.consideration.startAmount).toBe("9007199254740992000000");
});

test("cheapest does not mutate the caller's array", () => {
  const listings = [order({ amount: "20" }), order({ amount: "10" })];
  const before = listings.map((l) => l.consideration.startAmount);
  cheapestOf(listings);
  expect(listings.map((l) => l.consideration.startAmount)).toEqual(before);
});

test("cheapest of nothing is undefined rather than a crash", () => {
  expect(cheapestOf([])).toBeUndefined();
});

test("a sale listing is offered as a token, a bid is offered as currency", () => {
  expect(isSaleableListing(order({ amount: "1" }))).toBe(true);
  expect(isBid(order({ amount: "1" }))).toBe(false);

  const bid = order({ amount: "1", offer: { itemType: "ERC20" } } as never);
  expect(isBid(bid)).toBe(true);
  expect(isSaleableListing(bid)).toBe(false);
});

test("inactive orders are neither listings nor bids", () => {
  const cancelled = order({ amount: "1", status: "CANCELLED" } as never);
  expect(isSaleableListing(cancelled)).toBe(false);
  expect(isBid(cancelled)).toBe(false);
});

test("ERC1155 listings are saleable too, not just ERC721", () => {
  const multi = order({ amount: "1", offer: { itemType: "ERC1155" } } as never);
  expect(isSaleableListing(multi)).toBe(true);
});

function sale(timestamp: number, formatted?: string): ApiActivity {
  return { type: "sale", timestamp, price: formatted ? { formatted, currency: "STRK" } : undefined } as ApiActivity;
}

test("last sale is the most recent, regardless of array order", () => {
  const history = [sale(300, "3"), sale(100, "1"), sale(200, "2")];
  expect(latestSale(history)?.timestamp).toBe(300);
});

test("non-sale activity and priceless sales are ignored", () => {
  const history = [
    { type: "transfer", timestamp: 999 } as ApiActivity,
    sale(500),
    sale(100, "1"),
  ];
  expect(latestSale(history)?.timestamp).toBe(100);
});

test("no sales yields null rather than undefined behaviour", () => {
  expect(latestSale([])).toBeNull();
  expect(formatSale(null)).toBeNull();
});

test("a formatted sale reads as amount and currency, with no trailing space when currency is absent", () => {
  expect(formatSale(sale(1, "12.5"))).toBe("12.5 STRK");
  expect(formatSale({ type: "sale", timestamp: 1, price: { formatted: "12.5" } } as ApiActivity)).toBe("12.5");
});

function listing(offerer: string, amount: string): ApiOrder {
  return {
    status: "ACTIVE",
    offerer,
    offer: { itemType: "ERC1155", startAmount: amount },
    consideration: { startAmount: "1" },
  } as unknown as ApiOrder;
}

function bid(offerer: string, amount: string): ApiOrder {
  return {
    status: "ACTIVE",
    offerer,
    offer: { itemType: "ERC20", startAmount: amount },
    consideration: { startAmount: "1" },
  } as unknown as ApiOrder;
}

const ME = "0x036a8f48641d42dba28375c31651aa14a4413582da2db7655a362a9e4ffc20d2";
const OTHER = "0x000c9c000000000000000000000000000000000000000000000000000000022592";

test("listed quantity sums only my own listings", () => {
  const listings = [listing(ME, "10"), listing(ME, "5"), listing(OTHER, "99")];
  expect(listedQuantityBy(listings, ME)).toBe(15n);
});

test("a bid is never counted as editions, however large its amount", () => {
  // 5e18 is five tokens of payment, not five billion editions.
  expect(listedQuantityBy([bid(ME, "5000000000000000000")], ME)).toBe(0n);
});

test("addresses compare in normalised form, so a leading zero does not hide a listing", () => {
  const padded = "0x036a8f48641d42dba28375c31651aa14a4413582da2db7655a362a9e4ffc20d2";
  const unpadded = "0x36a8f48641d42dba28375c31651aa14a4413582da2db7655a362a9e4ffc20d2";
  expect(listedQuantityBy([listing(padded, "7")], unpadded)).toBe(7n);
});

test("no wallet means nothing is listed by me", () => {
  expect(listedQuantityBy([listing(ME, "10")], null)).toBe(0n);
});

test("a creator who listed everything they own has nothing left to list", () => {
  expect(hasUnlistedEditions("1892", 1892n)).toBe(false);
  expect(hasUnlistedEditions("1891", 1892n)).toBe(false);
});

test("a creator holding more than they listed can still list", () => {
  expect(hasUnlistedEditions("1892", 1000n)).toBe(true);
});

test("an unknown balance shows the action rather than hiding a legitimate one", () => {
  expect(hasUnlistedEditions(undefined, 0n)).toBe(true);
  expect(hasUnlistedEditions("not-a-number", 0n)).toBe(true);
});

test("quantities beyond Number.MAX_SAFE_INTEGER compare correctly", () => {
  expect(hasUnlistedEditions("9007199254740993", 9007199254740992n)).toBe(true);
  expect(hasUnlistedEditions("9007199254740992", 9007199254740993n)).toBe(false);
});
