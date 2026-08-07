import { test, expect, mock } from "bun:test";
import { deployWalletSponsored } from "./deploy-relay";

// A minimal but genuinely schema-valid TypedData payload — signMessage()
// validates real structure (types/primaryType/domain/message), so a bare
// placeholder object isn't enough to exercise the sign step.
const FAKE_TYPED_DATA = {
  types: {
    StarknetDomain: [
      { name: "name", type: "shortstring" },
      { name: "version", type: "shortstring" },
      { name: "chainId", type: "shortstring" },
      { name: "revision", type: "shortstring" },
    ],
    Ping: [{ name: "value", type: "felt" }],
  },
  primaryType: "Ping",
  domain: { name: "avnu.paymaster", version: "1", chainId: "SN_MAIN", revision: "1" },
  message: { value: "1" },
};

test("deployWalletSponsored calls build then execute and returns the tx hash", async () => {
  const calls: { url: string; body: unknown }[] = [];
  globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
    const body = JSON.parse(init!.body as string);
    calls.push({ url, body });
    if (url === "/api/wallet/deploy-sponsored/build") {
      return new Response(
        JSON.stringify({ typedData: FAKE_TYPED_DATA, deployment: { fake: "deployment" } }),
        { status: 200 },
      );
    }
    if (url === "/api/wallet/deploy-sponsored/execute") {
      expect(body.signature).toBeDefined();
      expect(body.deployment).toEqual({ fake: "deployment" });
      return new Response(JSON.stringify({ transactionHash: "0xtxhash" }), { status: 200 });
    }
    throw new Error(`Unexpected fetch to ${url}`);
  }) as never;

  // A real, valid Stark-curve private key (test-only) — signing needs a
  // genuine key, not a placeholder, since account.signMessage() does real
  // elliptic-curve math over the typed data hash.
  const testPrivateKey = "0x1";
  const result = await deployWalletSponsored(
    "0x00112233445566778899aabbccddeeff0011223344556677889900112233",
    "0xownerpub",
    testPrivateKey,
  );

  expect(result.transactionHash).toBe("0xtxhash");
  expect(calls[0].url).toBe("/api/wallet/deploy-sponsored/build");
  expect(calls[1].url).toBe("/api/wallet/deploy-sponsored/execute");
});

test("deployWalletSponsored throws when the build step fails", async () => {
  globalThis.fetch = mock(async () => new Response(JSON.stringify({ error: "boom" }), { status: 502 })) as never;
  await expect(
    deployWalletSponsored("0xaddr", "0xownerpub", "0x1"),
  ).rejects.toThrow();
});

test("deployWalletSponsored throws when the execute step fails", async () => {
  globalThis.fetch = mock(async (url: string) => {
    if (url === "/api/wallet/deploy-sponsored/build") {
      return new Response(JSON.stringify({ typedData: FAKE_TYPED_DATA, deployment: {} }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: "boom" }), { status: 502 });
  }) as never;
  await expect(
    deployWalletSponsored("0xaddr", "0xownerpub", "0x1"),
  ).rejects.toThrow();
});
