import { test, expect } from "bun:test";
import { walletProvider } from "./provider";

function nodeUrlOf(provider: ReturnType<typeof walletProvider>): string {
  return (provider as unknown as { channel: { nodeUrl: string } }).channel.nodeUrl;
}

test("walletProvider defaults to the metered /api/rpc proxy, not a direct public RPC URL", () => {
  expect(nodeUrlOf(walletProvider())).toBe("/api/rpc");
});

test("walletProvider still honors an explicit rpc override", () => {
  expect(nodeUrlOf(walletProvider("https://example.test/custom-rpc"))).toBe("https://example.test/custom-rpc");
});
