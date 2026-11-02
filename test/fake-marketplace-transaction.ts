import { useState } from "react";
import type { TransactionPhase } from "@medialane/ui";
import type { MarketplaceContext } from "@/lib/marketplace-intents";

interface FakeTransactionControl {
  started: number;
  resets: number;
  /** When set, start ends in the error phase with this message; `submitted` says whether a transaction was sent first. */
  fail: { message: string; retryable: boolean; submitted: boolean } | null;
  /** When true, start stays in the confirming phase and never resolves. */
  hang: boolean;
  /** When true, start runs the work it was given with `ctx`. */
  runWork: boolean;
  ctx: MarketplaceContext;
  clear(): void;
}

/** A stand-in for useMarketplaceTransaction whose outcome each test sets through `control`. */
export function createFakeMarketplaceTransaction() {
  const control: FakeTransactionControl = {
    started: 0,
    resets: 0,
    fail: null,
    hang: false,
    runWork: false,
    ctx: { client: {}, signer: { address: "0xabc" } } as unknown as MarketplaceContext,
    clear() {
      Object.assign(control, { started: 0, resets: 0, fail: null, hang: false, runWork: false });
    },
  };

  function useFakeMarketplaceTransaction() {
    const [state, setState] = useState<{
      phase: TransactionPhase;
      txHash: string | null;
      error: string | null;
      retryable: boolean;
    }>({ phase: "idle", txHash: null, error: null, retryable: true });
    return {
      phase: state.phase,
      busy: state.phase === "preparing" || state.phase === "submitting" || state.phase === "confirming",
      txHash: state.txHash,
      error: state.error,
      retryable: state.retryable,
      failedAfterSubmit: state.phase === "error" && state.txHash !== null,
      start: async (work: (ctx: MarketplaceContext) => Promise<unknown>): Promise<boolean> => {
        control.started++;
        if (control.hang) {
          setState({ phase: "confirming", txHash: null, error: null, retryable: true });
          return new Promise<boolean>(() => {});
        }
        try {
          if (control.runWork) await work(control.ctx);
          if (control.fail) throw Object.assign(new Error(control.fail.message), control.fail);
          setState({ phase: "success", txHash: "0xtx", error: null, retryable: true });
          return true;
        } catch (err) {
          const { retryable = true, submitted = true } = err as { retryable?: boolean; submitted?: boolean };
          setState({ phase: "error", txHash: submitted ? "0xtx" : null, error: (err as Error).message, retryable });
          return false;
        }
      },
      reset: () => {
        control.resets++;
        setState({ phase: "idle", txHash: null, error: null, retryable: true });
      },
    };
  }

  return { control, useFakeMarketplaceTransaction };
}
