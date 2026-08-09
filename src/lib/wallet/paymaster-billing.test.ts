import { afterEach, describe, expect, mock, test } from "bun:test";

// Mock the module directly rather than setting process.env — constants.ts
// reads MEDIALANE_API_KEY at module-load time, and bun's module cache is
// process-wide across the whole test run, so whichever test file imports
// "@/lib/constants" first (not necessarily this one) freezes the value for
// every other test in the same `bun test` invocation.
mock.module("@/lib/constants", () => ({
  MEDIALANE_BACKEND_URL: "http://localhost:3001",
  MEDIALANE_API_KEY: "test-key",
}));

describe("billPaymasterCall", () => {
  afterEach(() => {
    // @ts-expect-error test cleanup
    delete globalThis.fetch;
  });

  test("returns true when the backend accepts the charge", async () => {
    globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
      expect(url).toBe("http://localhost:3001/v1/paymaster/invoke/build");
      expect((init!.headers as Record<string, string>)["x-api-key"]).toBe("test-key");
      return new Response(JSON.stringify({ data: { billed: true } }), { status: 200 });
    }) as never;

    const { billPaymasterCall } = await import("./paymaster-billing");
    expect(await billPaymasterCall("invoke/build")).toBe(true);
  });

  test("returns false when the backend refuses (insufficient credits)", async () => {
    globalThis.fetch = mock(async () => new Response(JSON.stringify({ error: "insufficient credits" }), { status: 402 })) as never;

    const { billPaymasterCall } = await import("./paymaster-billing");
    expect(await billPaymasterCall("invoke/execute")).toBe(false);
  });

  test("returns false when the billing fetch itself throws", async () => {
    globalThis.fetch = mock(async () => { throw new Error("network down"); }) as never;

    const { billPaymasterCall } = await import("./paymaster-billing");
    expect(await billPaymasterCall("deploy/build")).toBe(false);
  });
});
