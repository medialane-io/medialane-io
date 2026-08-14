import { afterEach, describe, expect, mock, test } from "bun:test";

mock.module("@/lib/constants", () => ({
  MEDIALANE_BACKEND_URL: "http://localhost:3001",
  MEDIALANE_API_KEY: "test-key",
}));

describe("billSwapCall", () => {
  afterEach(() => {

    delete globalThis.fetch;
  });

  test("returns true when the backend accepts the charge", async () => {
    globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
      expect(url).toBe("http://localhost:3001/v1/swap/quote/meter");
      expect((init!.headers as Record<string, string>)["x-api-key"]).toBe("test-key");
      return new Response(JSON.stringify({ data: { billed: true } }), { status: 200 });
    }) as never;

    const { billSwapCall } = await import("./swap-billing");
    expect(await billSwapCall("quote")).toBe(true);
  });

  test("returns false when the backend refuses (insufficient credits)", async () => {
    globalThis.fetch = mock(async () => new Response(JSON.stringify({ error: "insufficient credits" }), { status: 402 })) as never;

    const { billSwapCall } = await import("./swap-billing");
    expect(await billSwapCall("build")).toBe(false);
  });

  test("returns false when the billing fetch itself throws", async () => {
    globalThis.fetch = mock(async () => { throw new Error("network down"); }) as never;

    const { billSwapCall } = await import("./swap-billing");
    expect(await billSwapCall("quote")).toBe(false);
  });
});
