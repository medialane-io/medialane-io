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
mock.module("@/lib/medialane-client", () => ({
  getMedialaneClient: () => ({
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
  setMintContract("0xmint");
});

test("restores success from storage", async () => {
  localStorage.setItem("k1", "0xabc");
  const { result } = renderHook(() => useGenesisMint({ address: "0xme", storageKey: "k1", messages }));
  await waitFor(() => expect(result.current.step).toBe("success"));
  expect(result.current.txHash).toBe("0xabc");
});

test("start without an address reports noAccount", async () => {
  const { result } = renderHook(() => useGenesisMint({ address: null, storageKey: null, messages }));
  await act(async () => {
    result.current.start();
  });
  await waitFor(() => expect(result.current.step).toBe("error"));
  expect(result.current.error).toBe("no account");
  expect(intentCalls).toEqual([]);
});

test("start without a mint contract reports notStarted", async () => {
  setMintContract("");
  const { result } = renderHook(() => useGenesisMint({ address: "0xme", storageKey: "k1", messages }));
  await act(async () => {
    result.current.start();
  });
  await waitFor(() => expect(result.current.step).toBe("error"));
  expect(result.current.error).toBe("not started");
  expect(intentCalls).toEqual([]);
});

test("success stores the hash under storageKey", async () => {
  const { result } = renderHook(() => useGenesisMint({ address: "0xme", storageKey: "k1", messages }));
  await act(async () => {
    result.current.start();
  });
  await waitFor(() => expect(result.current.step).toBe("success"));
  expect(result.current.txHash).toBe("0xtx");
  expect(localStorage.getItem("k1")).toBe("0xtx");
  expect(intentCalls).toEqual([{ kind: "genesis-mint", params: { owner: "0xsigner", recipient: "0xme" } }]);
});

test("success with a null storageKey writes nothing", async () => {
  const { result } = renderHook(() => useGenesisMint({ address: "0xme", storageKey: null, messages }));
  await act(async () => {
    result.current.start();
  });
  await waitFor(() => expect(result.current.step).toBe("success"));
  expect(localStorage.length).toBe(0);
});

test("retry returns to ready", async () => {
  runFailure = new Error("boom");
  const { result } = renderHook(() => useGenesisMint({ address: "0xme", storageKey: "k1", messages }));
  await act(async () => {
    result.current.start();
  });
  await waitFor(() => expect(result.current.step).toBe("error"));
  expect(result.current.error).toBe("boom");
  act(() => result.current.retry());
  expect(result.current.step).toBe("ready");
  expect(result.current.error).toBeNull();
});

test("resetStored clears the marker", async () => {
  localStorage.setItem("k1", "0xabc");
  const { result } = renderHook(() => useGenesisMint({ address: "0xme", storageKey: "k1", messages }));
  await waitFor(() => expect(result.current.step).toBe("success"));
  act(() => result.current.resetStored());
  expect(localStorage.getItem("k1")).toBeNull();
  expect(result.current.txHash).toBeNull();
  expect(result.current.step).toBe("ready");
});
