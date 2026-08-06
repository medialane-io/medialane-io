import { test, expect } from "bun:test";
import { getNetworkConfig } from "./networks";

test("getNetworkConfig returns a mainnet config pointed at a public fallback, not /api/rpc", () => {
  const config = getNetworkConfig();
  expect(config.label).toBe("Starknet Mainnet");
  expect(config.rpcUrl).not.toBe("/api/rpc");
  expect(config.rpcUrl.startsWith("http")).toBe(true);
});
