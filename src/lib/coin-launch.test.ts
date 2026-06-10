import { describe, it, expect } from "bun:test";
import {
  validateName, validateSymbol, validateSupply,
  toRaw, teamCoinsRaw, buybackQuoteRaw, fdvHuman,
  MAX_SUPPLY,
} from "./coin-launch";

describe("validateName / validateSymbol (≤31 bytes felt252)", () => {
  it("accepts short ASCII", () => {
    expect(validateName("SmokeTest")).toBeNull();
    expect(validateSymbol("SMOKE")).toBeNull();
  });
  it("rejects empty", () => {
    expect(validateName("")).toMatch(/required/i);
  });
  it("rejects > 31 bytes", () => {
    expect(validateName("x".repeat(32))).toMatch(/31/);
  });
});

describe("validateSupply", () => {
  it("accepts an in-range integer", () => {
    expect(validateSupply("1000000")).toBeNull();
  });
  it("rejects below min", () => {
    expect(validateSupply("999")).toMatch(/at least/i);
  });
  it("rejects above max", () => {
    expect(validateSupply((MAX_SUPPLY + 1n).toString())).toMatch(/at most/i);
  });
  it("rejects non-integers", () => {
    expect(validateSupply("1.5")).toMatch(/whole number/i);
  });
});

describe("raw conversions + buyback", () => {
  it("toRaw scales by 18 decimals", () => {
    expect(toRaw(1000n)).toBe(1000n * 10n ** 18n);
  });
  it("teamCoinsRaw = supply * pct%", () => {
    const supplyRaw = 1_000_000n * 10n ** 18n;
    expect(teamCoinsRaw(supplyRaw, 5)).toBe(50_000n * 10n ** 18n);
  });
  it("teamCoinsRaw is 0 at 0%", () => {
    expect(teamCoinsRaw(1_000_000n * 10n ** 18n, 0)).toBe(0n);
  });
  it("buybackQuoteRaw = teamCoins * 0.01 (18-dec quote)", () => {
    const teamRaw = 50_000n * 10n ** 18n;
    expect(buybackQuoteRaw(teamRaw, 18)).toBe(500n * 10n ** 18n);
  });
  it("fdvHuman = supply * 0.01", () => {
    expect(fdvHuman(1_000_000)).toBeCloseTo(10_000, 6);
  });
});
