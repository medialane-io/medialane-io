import { beforeEach, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import type { TransactionPhase } from "@medialane/ui";

const invalidations: unknown[] = [];
const realSwr = await import("swr");
mock.module("swr", () => ({
  ...realSwr,
  useSWRConfig: () => ({
    mutate: (matcher: unknown) => {
      invalidations.push(matcher);
      return Promise.resolve([]);
    },
  }),
}));

const { MedialaneAppProvider } = await import("@medialane/ui");
const { useMarketplaceTransaction } = await import("./use-marketplace-transaction");

const signer = {
  address: "0xabc",
  signTypedData: async () => ["0xr", "0xs"],
  execute: async () => ({ txHash: "0xtx" }),
};

/** Stands in for useTransaction: hands a tracked signer to the work and reports phases like the real one. */
function useFakeTransaction() {
  const [state, setState] = useState<{ phase: TransactionPhase; txHash: string | null; error: string | null }>({
    phase: "idle",
    txHash: null,
    error: null,
  });
  return {
    ...state,
    retryable: true,
    run: async (work: (s: typeof signer) => Promise<void>) => {
      let txHash: string | null = null;
      setState({ phase: "preparing", txHash, error: null });
      const tracked = {
        ...signer,
        execute: async () => {
          txHash = "0xtx";
          setState({ phase: "confirming", txHash, error: null });
          return { txHash };
        },
      };
      try {
        await work(tracked);
        setState({ phase: "success", txHash, error: null });
        return true;
      } catch (err) {
        setState({ phase: "error", txHash, error: (err as Error).message });
        return false;
      }
    },
    reset: () => setState({ phase: "idle", txHash: null, error: null }),
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MedialaneAppProvider
      value={{
        getClient: () => ({ api: {} }) as never,
        getSigner: () => signer,
        walletAddress: signer.address,
        onRequireWallet: () => {},
      }}
    >
      {children}
    </MedialaneAppProvider>
  );
}

const render = () => renderHook(() => useMarketplaceTransaction(useFakeTransaction), { wrapper });

beforeEach(() => {
  invalidations.length = 0;
});

test("busy while work runs, success after", async () => {
  const { result } = render();
  let finish!: () => void;
  let started!: Promise<boolean>;
  await act(async () => {
    started = result.current.start(async (ctx) => {
      await ctx.signer.execute([]);
      await new Promise<void>((r) => { finish = r; });
    });
    await Promise.resolve();
  });
  expect(result.current.busy).toBe(true);
  await act(async () => {
    finish();
    expect(await started).toBe(true);
  });
  expect(result.current.phase).toBe("success");
  expect(result.current.busy).toBe(false);
  expect(result.current.txHash).toBe("0xtx");
});

test("work gets a client and the transaction's signer", async () => {
  const { result } = render();
  let seen: { client: unknown; signer: unknown } | null = null;
  await act(async () => {
    await result.current.start(async (ctx) => { seen = { client: ctx.client, signer: ctx.signer }; });
  });
  expect(seen!.client).toBeTruthy();
  expect((seen!.signer as typeof signer).address).toBe(signer.address);
});

test("invalidates after a successful run and after a failed run", async () => {
  const { result } = render();
  await act(async () => { await result.current.start(async () => {}); });
  expect(invalidations).toHaveLength(1);
  let ok = true;
  await act(async () => { ok = await result.current.start(async () => { throw new Error("no"); }); });
  expect(ok).toBe(false);
  expect(invalidations).toHaveLength(2);
  expect(result.current.phase).toBe("error");
  expect(result.current.error).toBe("no");
  expect(result.current.retryable).toBe(true);
});

test("the invalidator matches order and token keys, not others", async () => {
  const { result } = render();
  await act(async () => { await result.current.start(async () => {}); });
  const matcher = invalidations[0] as (key: unknown) => boolean;
  const { QUERY_PREFIX } = await import("@medialane/ui/utils/query-keys");
  expect(matcher(`${QUERY_PREFIX.listings}-x`)).toBe(true);
  expect(matcher(`${QUERY_PREFIX.tokensOwned}-0xabc`)).toBe(true);
  expect(matcher("profile-0xabc")).toBe(false);
  expect(matcher(["array-key"])).toBe(false);
});

test("failedAfterSubmit is true only when the failure came after a transaction was sent", async () => {
  const { result } = render();
  await act(async () => { await result.current.start(async () => { throw new Error("prompt closed"); }); });
  expect(result.current.phase).toBe("error");
  expect(result.current.failedAfterSubmit).toBe(false);
  await act(async () => {
    await result.current.start(async (ctx) => { await ctx.signer.execute([]); throw new Error("reverted"); });
  });
  expect(result.current.failedAfterSubmit).toBe(true);
});

test("reset returns to idle with no error or hash", async () => {
  const { result } = render();
  await act(async () => { await result.current.start(async (ctx) => { await ctx.signer.execute([]); throw new Error("no"); }); });
  expect(result.current.txHash).toBe("0xtx");
  act(() => result.current.reset());
  expect(result.current.phase).toBe("idle");
  expect(result.current.error).toBeNull();
  expect(result.current.txHash).toBeNull();
});
