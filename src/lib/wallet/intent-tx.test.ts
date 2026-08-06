import { test, expect } from "bun:test";
import { executePrebuiltIntent, signAndExecuteIntent, confirmIntentBestEffort } from "./intent-tx";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";

function fakeSigner(overrides: Partial<StarknetVenueSigner> = {}): StarknetVenueSigner {
  return {
    address: "0xwallet",
    signTypedData: async () => ["0xr", "0xs"],
    execute: async () => ({ txHash: "0xtx" }),
    ...overrides,
  };
}

function fakeClient(overrides: Record<string, unknown> = {}) {
  return {
    api: {
      confirmIntent: async () => ({}),
      submitIntentSignature: async () => ({ data: { calls: [{ contractAddress: "0xc", entrypoint: "e", calldata: [] }] } }),
      ...overrides,
    },
  } as never;
}

test("executePrebuiltIntent executes the intent's calls and confirms by default", async () => {
  let confirmedWith: [string, string] | null = null;
  const client = fakeClient({ confirmIntent: async (id: string, txHash: string) => { confirmedWith = [id, txHash]; } });
  const result = await executePrebuiltIntent(fakeSigner(), client, { id: "intent-1", calls: [] });
  expect(result.txHash).toBe("0xtx");
  expect(confirmedWith).toEqual(["intent-1", "0xtx"]);
});

test("executePrebuiltIntent skips confirmation when confirm:false", async () => {
  let confirmCalled = false;
  const client = fakeClient({ confirmIntent: async () => { confirmCalled = true; } });
  await executePrebuiltIntent(fakeSigner(), client, { id: "intent-1", calls: [] }, { confirm: false });
  expect(confirmCalled).toBe(false);
});

test("executePrebuiltIntent never throws when confirmation fails (best-effort)", async () => {
  const client = fakeClient({ confirmIntent: async () => { throw new Error("network error"); } });
  const result = await executePrebuiltIntent(fakeSigner(), client, { id: "intent-1", calls: [] });
  expect(result.txHash).toBe("0xtx");
});

test("signAndExecuteIntent signs typed data, submits, then executes the populated calls", async () => {
  const signed: unknown[] = [];
  const signer = fakeSigner({ signTypedData: async (td) => { signed.push(td); return ["0xr", "0xs"]; } });
  const client = fakeClient();
  const result = await signAndExecuteIntent(signer, client, {
    id: "intent-2",
    typedData: { domain: {}, message: {}, primaryType: "x", types: {} } as never,
  });
  expect(signed.length).toBe(1);
  expect(result.txHash).toBe("0xtx");
});

test("confirmIntentBestEffort swallows errors", async () => {
  const client = fakeClient({ confirmIntent: async () => { throw new Error("boom"); } });
  await expect(confirmIntentBestEffort(client, "id", "0xtx")).resolves.toBeUndefined();
});
