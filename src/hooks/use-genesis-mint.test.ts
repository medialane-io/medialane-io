import { test, expect, mock, beforeEach } from "bun:test";
import { useState } from "react";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { renderHook, waitFor, act } from "@testing-library/react";

if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();

const realUi = await import("@medialane/ui");

const created: unknown[] = [];
let txHash = "0xtx";
let runFailure: Error | null = null;

mock.module("@medialane/ui", () => ({
  ...realUi,
  runIntentCalls: async (_signer: unknown, create: () => Promise<unknown>) => {
    created.push(await create());
    return { txHash };
  },
  useTransaction: () => {
    const [state, setState] = useState({ phase: "idle", txHash: null as string | null, error: null as string | null });
    return {
      ...state,
      receipt: null,
      retryable: false,
      run: async (work: (signer: { address: string }) => Promise<void>) => {
        try {
          await work({ address: "0xsigner" });
          if (runFailure) throw runFailure;
          setState({ phase: "success", txHash, error: null });
          return true;
        } catch (err) {
          setState({ phase: "error", txHash: null, error: (err as Error).message });
          return false;
        }
      },
      reset: () => setState({ phase: "idle", txHash: null, error: null }),
    };
  },
}));

const setMintContract = (value: string) => mock.module("@/lib/constants", () => ({ MINT_CONTRACT: value }));
setMintContract("0xmint");

const intentCalls: unknown[] = [];
const chain = { balance: "0x0", tokenId: "0x2a", down: false };
mock.module("@/lib/medialane-client", () => ({
  getMedialaneClient: () => ({
    provider: {
      callContract: async ({ entrypoint }: { entrypoint: string }) => {
        if (chain.down) throw new Error("rpc down");
        if (entrypoint === "balanceOf") return [chain.balance, "0x0"];
        if (entrypoint === "token_of_owner_by_index") return [chain.tokenId, "0x0"];
        throw new Error(`unexpected ${entrypoint}`);
      },
    },
    api: {
      intents: {
        create: async (kind: string, params: unknown) => {
          intentCalls.push({ kind, params });
          return { id: "intent-1", calls: [] };
        },
      },
    },
  }),
}));

const { useGenesisMint } = await import("./use-genesis-mint");

const messages = {
  preparing: "preparing",
  submitting: "submitting",
  noAccount: "no account",
  notStarted: "not started",
};

beforeEach(() => {
  localStorage.clear();
  created.length = 0;
  intentCalls.length = 0;
  txHash = "0xtx";
  runFailure = null;
  chain.balance = "0x0";
  chain.tokenId = "0x2a";
  chain.down = false;
  setMintContract("0xmint");
});

const render = (address: string | null = "0xme") =>
  renderHook(() => useGenesisMint({ address, messages }));

test("checks the chain before offering the mint", async () => {
  const { result } = render();
  expect(result.current.step).toBe("checking");
  await waitFor(() => expect(result.current.step).toBe("ready"));
});

test("a wallet that holds the token starts on success with a link to it", async () => {
  chain.balance = "0x1";
  const { result } = render();
  await waitFor(() => expect(result.current.step).toBe("success"));
  expect(result.current.tokenId).toBe("42");
  expect(result.current.txHash).toBeNull();
});

test("an unreachable chain falls back to ready", async () => {
  chain.down = true;
  const { result } = render();
  await waitFor(() => expect(result.current.step).toBe("ready"));
});

test("no chain read happens without an address or a mint contract", async () => {
  const none = render(null);
  expect(none.result.current.step).toBe("ready");
  setMintContract("");
  const unset = render();
  expect(unset.result.current.step).toBe("ready");
});

test("start without an address reports noAccount", async () => {
  const { result } = render(null);
  await act(async () => {
    result.current.start();
  });
  await waitFor(() => expect(result.current.step).toBe("error"));
  expect(result.current.error).toBe("no account");
  expect(intentCalls).toEqual([]);
});

test("start without a mint contract reports notStarted", async () => {
  setMintContract("");
  const { result } = render();
  await act(async () => {
    result.current.start();
  });
  await waitFor(() => expect(result.current.step).toBe("error"));
  expect(result.current.error).toBe("not started");
  expect(intentCalls).toEqual([]);
});

test("a completed mint shows its transaction and then the token", async () => {
  const { result } = render();
  await waitFor(() => expect(result.current.step).toBe("ready"));
  chain.balance = "0x1";
  await act(async () => {
    result.current.start();
  });
  await waitFor(() => expect(result.current.step).toBe("success"));
  expect(result.current.txHash).toBe("0xtx");
  expect(intentCalls).toEqual([{ kind: "genesis-mint", params: { owner: "0xsigner", recipient: "0xme" } }]);
  await waitFor(() => expect(result.current.tokenId).toBe("42"));
});

test("retry returns to ready", async () => {
  runFailure = new Error("boom");
  const { result } = render();
  await waitFor(() => expect(result.current.step).toBe("ready"));
  await act(async () => {
    result.current.start();
  });
  await waitFor(() => expect(result.current.step).toBe("error"));
  expect(result.current.error).toBe("boom");
  act(() => result.current.retry());
  expect(result.current.step).toBe("ready");
  expect(result.current.error).toBeNull();
});

test("mintAnother lets a holder mint again", async () => {
  chain.balance = "0x1";
  const { result } = render();
  await waitFor(() => expect(result.current.step).toBe("success"));
  act(() => result.current.mintAnother());
  expect(result.current.step).toBe("ready");
  expect(result.current.txHash).toBeNull();
});
