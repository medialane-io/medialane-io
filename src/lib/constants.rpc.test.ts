import { test, expect } from "bun:test";
import { RPC_URLS } from "@/lib/constants";

test("RPC_URLS is a non-empty ordered list", () => {
  expect(Array.isArray(RPC_URLS)).toBe(true);
  expect(RPC_URLS.length).toBeGreaterThan(0);
});

test("RPC_URLS contains no duplicates", () => {
  expect(new Set(RPC_URLS).size).toBe(RPC_URLS.length);
});

test("RPC_URLS ends with the public lava fallback", () => {
  expect(RPC_URLS[RPC_URLS.length - 1]).toBe("https://rpc.starknet.lava.build");
});

test("RPC_URLS holds no empty or partially-resolved entries", () => {
  for (const url of RPC_URLS) {
    expect(url.length).toBeGreaterThan(0);
    expect(url).not.toContain("undefined");
  }
});
