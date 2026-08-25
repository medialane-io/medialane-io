import { test, expect, mock } from "bun:test";
import type { SealedOwner } from "./passkey";

const FAKE_SEALED: SealedOwner = {
  credentialId: "cred1", ownerPubKey: "0xabc", address: "0xdeadbeef", iv: "iv1", ciphertext: "ct1",
};

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

mock.module("./passkey", () => ({
  signWith: async () => ["0xr", "0xs"] as [string, string],
  signWithPrivateKey: () => ["0xr", "0xs"] as [string, string],
  unlockOwnerKey: async () => "0xprivkey",
}));

const { executeSponsored, SponsorUnavailableError } = await import("./sponsored-invoke");

test("executeSponsored calls build then execute and returns the tx hash", async () => {
  const calls: { url: string; body: unknown }[] = [];
  globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
    const body = JSON.parse(init!.body as string);
    calls.push({ url, body });
    if (url === "/api/wallet/sponsored-invoke/build") {
      expect(body.userAddress).toBe(FAKE_SEALED.address);
      expect(Array.isArray(body.calls)).toBe(true);
      return new Response(JSON.stringify({ typedData: FAKE_TYPED_DATA }), { status: 200 });
    }
    if (url === "/api/wallet/sponsored-invoke/execute") {
      expect(body.userAddress).toBe(FAKE_SEALED.address);
      expect(body.signature).toEqual(["0xr", "0xs"]);
      expect(body.typedData).toEqual(FAKE_TYPED_DATA);
      expect(Array.isArray(body.calls)).toBe(true);
      return new Response(JSON.stringify({ transactionHash: "0xtxhash" }), { status: 200 });
    }
    throw new Error(`Unexpected fetch to ${url}`);
  }) as never;

  const result = await executeSponsored(FAKE_SEALED, [{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }]);

  expect(result.transactionHash).toBe("0xtxhash");
  expect(calls[0].url).toBe("/api/wallet/sponsored-invoke/build");
  expect(calls[1].url).toBe("/api/wallet/sponsored-invoke/execute");
});

test("executeSponsored throws SponsorUnavailableError when the build step fails, safe to retry another way", async () => {
  globalThis.fetch = mock(async () => new Response(JSON.stringify({ error: "boom" }), { status: 502 })) as never;
  await expect(
    executeSponsored(FAKE_SEALED, [{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }]),
  ).rejects.toThrow("boom");
  await expect(
    executeSponsored(FAKE_SEALED, [{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }]),
  ).rejects.toBeInstanceOf(SponsorUnavailableError);
});

test("executeSponsored throws a plain error when the execute step fails, since it may already have broadcast", async () => {
  globalThis.fetch = mock(async (url: string) => {
    if (url === "/api/wallet/sponsored-invoke/build") {
      return new Response(JSON.stringify({ typedData: FAKE_TYPED_DATA }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: "boom" }), { status: 502 });
  }) as never;
  await expect(
    executeSponsored(FAKE_SEALED, [{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }]),
  ).rejects.toThrow("boom");
  await expect(
    executeSponsored(FAKE_SEALED, [{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }]),
  ).rejects.not.toBeInstanceOf(SponsorUnavailableError);
});

test("executeSponsored falls back to a friendly message when the response has no error field", async () => {
  globalThis.fetch = mock(async () => new Response("not json", { status: 502 })) as never;
  await expect(
    executeSponsored(FAKE_SEALED, [{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }]),
  ).rejects.toThrow("We couldn't prepare this transaction");
});

// paymaster.ts runs body validation, the account rate limit, the entrypoint
// allowlist, and the contract-address allowlist entirely before it ever
// calls AVNU's executeTransaction — a rejection at any of those stages is
// guaranteed nothing was broadcast, so it's safe to retry self-funded. AVNU
// misconfiguration (503, e.g. no API key) is the same: defaultClient() throws
// before .executeTransaction() is ever reached.
for (const status of [400, 429, 503]) {
  test(`executeSponsored treats a ${status} from the execute step as sponsor-unavailable — nothing could have broadcast yet`, async () => {
    globalThis.fetch = mock(async (url: string) => {
      if (url === "/api/wallet/sponsored-invoke/build") {
        return new Response(JSON.stringify({ typedData: FAKE_TYPED_DATA }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: "boom" }), { status });
    }) as never;
    await expect(
      executeSponsored(FAKE_SEALED, [{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }]),
    ).rejects.toBeInstanceOf(SponsorUnavailableError);
  });
}

// A 422 means AVNU itself simulated the transaction and rejected it (account
// not deployed yet, or the call would revert) — self-funded would hit the
// exact same on-chain outcome, so retrying would just waste the user's real
// gas on a call that's going to fail regardless of who pays for it.
test("executeSponsored does NOT retry on a 422 — the call itself is the problem, not the sponsor", async () => {
  globalThis.fetch = mock(async (url: string) => {
    if (url === "/api/wallet/sponsored-invoke/build") {
      return new Response(JSON.stringify({ typedData: FAKE_TYPED_DATA }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: "boom" }), { status: 422 });
  }) as never;
  await expect(
    executeSponsored(FAKE_SEALED, [{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }]),
  ).rejects.not.toBeInstanceOf(SponsorUnavailableError);
});
