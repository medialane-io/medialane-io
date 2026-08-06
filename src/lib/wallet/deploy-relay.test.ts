import { test, expect, mock } from "bun:test";
import { deployWalletViaRelay } from "./deploy-relay";

test("deployWalletViaRelay posts to the proxy and returns the parsed address", async () => {
  const fetchMock = mock(async (url: string, init?: RequestInit) => {
    expect(url).toBe("/api/proxy/v1/wallet/deploy");
    expect(JSON.parse(init!.body as string)).toEqual({ ownerPubkey: "0xowner", salt: "0x0" });
    return new Response(JSON.stringify({ data: { address: "0xnew", alreadyDeployed: false } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  globalThis.fetch = fetchMock as never;

  const result = await deployWalletViaRelay("0xowner");
  expect(result.address).toBe("0xnew");
  expect(result.alreadyDeployed).toBe(false);
});

test("deployWalletViaRelay throws on a non-OK response", async () => {
  globalThis.fetch = mock(async () => new Response(JSON.stringify({ error: "bad_request" }), { status: 400 })) as never;
  await expect(deployWalletViaRelay("0xowner")).rejects.toThrow();
});
