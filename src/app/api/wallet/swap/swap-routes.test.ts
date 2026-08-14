import { afterEach, describe, expect, mock, test } from "bun:test";

// Regression guard for the "nothing forwards to AVNU without a debit first"
// invariant (medialane-backend audit, 2026-08-13): both routes must call
// billSwapCall and bail on a false return BEFORE touching AVNU. A refactor
// that drops or reorders that call would silently let swaps bypass metering
// with no error — these tests fail loudly if that happens.

const getQuotesMock = mock(async () => [{ quoteId: "q1" }]);
const quoteToCallsMock = mock(async () => ({ calls: [], chainId: "0x1" }));

mock.module("@avnu/avnu-sdk", () => ({
  getQuotes: getQuotesMock,
  quoteToCalls: quoteToCallsMock,
}));

mock.module("@medialane/sdk", () => ({
  getTokenBySymbol: (symbol: string) => ({ symbol, address: "0xtoken" }),
  stringifyBigInts: (v: unknown) => v,
}));

const billSwapCallMock = mock(async () => true);
mock.module("@/lib/wallet/swap-billing", () => ({
  billSwapCall: billSwapCallMock,
}));

const body = {
  sellSymbol: "USDC",
  buySymbol: "STRK",
  buyAmountRaw: "1000",
  takerAddress: "0xabc",
};

function req(payload: unknown) {
  return new Request("http://localhost/api/wallet/swap/quote", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as never;
}

describe("swap quote/build routes never forward to AVNU on a failed/skipped bill", () => {
  afterEach(() => {
    getQuotesMock.mockClear();
    quoteToCallsMock.mockClear();
    billSwapCallMock.mockClear();
  });

  test("quote route: billing succeeds -> AVNU is called", async () => {
    billSwapCallMock.mockImplementationOnce(async () => true);
    const { POST } = await import("./quote/route");
    const res = await POST(req(body));
    expect(billSwapCallMock).toHaveBeenCalledWith("quote");
    expect(getQuotesMock).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  test("quote route: billing fails -> AVNU is never called, 402 returned", async () => {
    billSwapCallMock.mockImplementationOnce(async () => false);
    const { POST } = await import("./quote/route");
    const res = await POST(req(body));
    expect(billSwapCallMock).toHaveBeenCalledWith("quote");
    expect(getQuotesMock).not.toHaveBeenCalled();
    expect(res.status).toBe(402);
  });

  test("build route: billing succeeds -> AVNU is called", async () => {
    billSwapCallMock.mockImplementationOnce(async () => true);
    const { POST } = await import("./build/route");
    const res = await POST(req(body));
    expect(billSwapCallMock).toHaveBeenCalledWith("build");
    expect(getQuotesMock).toHaveBeenCalledTimes(1);
    expect(quoteToCallsMock).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  test("build route: billing fails -> AVNU is never called, 402 returned", async () => {
    billSwapCallMock.mockImplementationOnce(async () => false);
    const { POST } = await import("./build/route");
    const res = await POST(req(body));
    expect(billSwapCallMock).toHaveBeenCalledWith("build");
    expect(getQuotesMock).not.toHaveBeenCalled();
    expect(quoteToCallsMock).not.toHaveBeenCalled();
    expect(res.status).toBe(402);
  });
});
