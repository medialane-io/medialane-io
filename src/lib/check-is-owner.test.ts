import { describe, expect, test } from "bun:test";
import { checkIsOwner } from "./utils";

const W = "0x" + "b".repeat(64);
const X = "0x" + "c".repeat(64);
const topHolders = Array.from({ length: 50 }, (_, i) => ({ owner: "0x" + (i + 1).toString(16), amount: "5" }));

describe("checkIsOwner", () => {
  test("a holder outside the listed holders is an owner by their own balance", () => {
    expect(checkIsOwner({ balances: topHolders }, W, "1")).toBe(true);
  });

  test("a zero balance is not an owner", () => {
    expect(checkIsOwner({ balances: [{ owner: W, amount: "1" }] }, W, "0")).toBe(false);
  });

  test("without a balance the listed holders decide", () => {
    expect(checkIsOwner({ balances: [{ owner: W, amount: "1" }] }, W)).toBe(true);
    expect(checkIsOwner({ balances: [{ owner: X, amount: "1" }] }, W)).toBe(false);
  });

  test("a token with no indexed balances falls back to its owner", () => {
    expect(checkIsOwner({ owner: W, balances: [] }, W, "0")).toBe(true);
  });
});
