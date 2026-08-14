import { afterEach, describe, expect, mock, test } from "bun:test";

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

describe("swap quote/build routes accept a coin by address, not just catalogue symbols", () => {
  afterEach(() => {
    getQuotesMock.mockClear();
    billSwapCallMock.mockClear();
  });

  const coinAddress = "0x00acc2fa3bb7f6a6726c14d9e142d51fe3984dbfa32b5907e1e76425177875e2";

  test("quote route: buy side by address -> AVNU is called with that address", async () => {
    billSwapCallMock.mockImplementationOnce(async () => true);
    const { POST } = await import("./quote/route");
    const res = await POST(req({ sellSymbol: "STRK", buyTokenAddress: coinAddress, buyAmountRaw: "1000" }));
    expect(res.status).toBe(200);
    expect(getQuotesMock).toHaveBeenCalledWith(
      expect.objectContaining({ buyTokenAddress: coinAddress }),
    );
  });

  test("quote route: both symbol and address given for the same side -> 400, AVNU never called", async () => {
    const { POST } = await import("./quote/route");
    const res = await POST(
      req({ sellSymbol: "STRK", buySymbol: "USDC", buyTokenAddress: coinAddress, buyAmountRaw: "1000" }),
    );
    expect(res.status).toBe(400);
    expect(getQuotesMock).not.toHaveBeenCalled();
  });

  test("quote route: neither symbol nor address given for a side -> 400", async () => {
    const { POST } = await import("./quote/route");
    const res = await POST(req({ sellSymbol: "STRK", buyAmountRaw: "1000" }));
    expect(res.status).toBe(400);
    expect(getQuotesMock).not.toHaveBeenCalled();
  });

  test("build route: sell side by address -> AVNU is called with that address", async () => {
    billSwapCallMock.mockImplementationOnce(async () => true);
    const { POST } = await import("./build/route");
    const res = await POST(
      req({ sellTokenAddress: coinAddress, buySymbol: "STRK", buyAmountRaw: "1000", takerAddress: "0xabc" }),
    );
    expect(res.status).toBe(200);
    expect(getQuotesMock).toHaveBeenCalledWith(
      expect.objectContaining({ sellTokenAddress: coinAddress }),
    );
  });
});

describe("swap quote/build routes accept sellAmountRaw as an alternative to buyAmountRaw", () => {
  afterEach(() => {
    getQuotesMock.mockClear();
    billSwapCallMock.mockClear();
  });

  test("quote route: sellAmountRaw -> AVNU called with sellAmount, not buyAmount", async () => {
    billSwapCallMock.mockImplementationOnce(async () => true);
    const { POST } = await import("./quote/route");
    const res = await POST(req({ sellSymbol: "STRK", buySymbol: "USDC", sellAmountRaw: "5000" }));
    expect(res.status).toBe(200);
    const call = getQuotesMock.mock.calls[0][0] as { sellAmount?: bigint; buyAmount?: bigint };
    expect(call.sellAmount).toBe(5000n);
    expect(call.buyAmount).toBeUndefined();
  });

  test("quote route: both sellAmountRaw and buyAmountRaw given -> 400, AVNU never called", async () => {
    const { POST } = await import("./quote/route");
    const res = await POST(
      req({ sellSymbol: "STRK", buySymbol: "USDC", sellAmountRaw: "5000", buyAmountRaw: "1000" }),
    );
    expect(res.status).toBe(400);
    expect(getQuotesMock).not.toHaveBeenCalled();
  });

  test("quote route: neither sellAmountRaw nor buyAmountRaw given -> 400", async () => {
    const { POST } = await import("./quote/route");
    const res = await POST(req({ sellSymbol: "STRK", buySymbol: "USDC" }));
    expect(res.status).toBe(400);
    expect(getQuotesMock).not.toHaveBeenCalled();
  });

  test("build route: sellAmountRaw -> AVNU called with sellAmount, not buyAmount", async () => {
    billSwapCallMock.mockImplementationOnce(async () => true);
    const { POST } = await import("./build/route");
    const res = await POST(
      req({ sellSymbol: "STRK", buySymbol: "USDC", sellAmountRaw: "5000", takerAddress: "0xabc" }),
    );
    expect(res.status).toBe(200);
    const call = getQuotesMock.mock.calls[0][0] as { sellAmount?: bigint; buyAmount?: bigint };
    expect(call.sellAmount).toBe(5000n);
    expect(call.buyAmount).toBeUndefined();
  });
});
