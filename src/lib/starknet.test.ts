import { test, expect } from "bun:test";
import { starknetProvider } from "./starknet";

test("starknetProvider's failover fetch has no public-RPC escape hatch", () => {
  const nodeUrl = (starknetProvider as unknown as { channel: { nodeUrl: string } }).channel.nodeUrl;
  expect(nodeUrl.includes("lava.build")).toBe(false);
});
