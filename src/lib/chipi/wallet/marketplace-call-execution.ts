import type { WalletData, SessionKeyData } from "@chipi-stack/types";
import { starknetProvider } from "@/lib/starknet";
import { formatStarknetInfrastructureError } from "@/lib/infrastructure-error-message";

/** Matches Chipi `Call` / `ChipiCall` shape used by intents */
export type MarketplaceCall = {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
};

export type MarketplaceExecutionResult = {
  txHash: string;
  status: "confirmed" | "reverted";
  revertReason?: string;
};

type CallAnyFn = (args: {
  params: {
    encryptKey: string;
    wallet: { publicKey: string; encryptedPrivateKey: string };
    contractAddress: string;
    calls: MarketplaceCall[];
  };
  bearerToken: string;
}) => Promise<unknown>;

type ExecuteWithSessionFn = (args: {
  params: {
    encryptKey: string;
    wallet: {
      publicKey: string;
      encryptedPrivateKey: string;
      walletType: "CHIPI";
    };
    session: SessionKeyData;
    calls: MarketplaceCall[];
  };
  bearerToken: string;
}) => Promise<unknown>;

/**
 * Run marketplace intent calls via Chipi: prefer session execution (wallet transfer pattern)
 * when remember-session UX is on and a session exists; otherwise owner path via callAnyContract.
 */
export async function executeMarketplaceCalls(params: {
  bearerToken: string;
  wallet: WalletData | null | undefined;
  storedSession: SessionKeyData | null;
  /** PIN or passkey-derived material for owner path and default session decrypt */
  encryptKey: string;
  /** In-memory unlock (TTL) — preferred for session decrypt when set */
  sessionUnlockKey: string | null;
  useSessionExecution: boolean;
  contractAddress: string;
  calls: MarketplaceCall[];
  callAnyContractAsync: CallAnyFn;
  executeWithSessionAsync: ExecuteWithSessionFn;
  /** Called with tx hash after RPC submit, before waiting for receipt */
  onSubmitted?: (txHash: string) => void;
}): Promise<MarketplaceExecutionResult> {
  const {
    bearerToken,
    wallet,
    storedSession,
    encryptKey,
    sessionUnlockKey,
    useSessionExecution,
    contractAddress,
    calls,
    callAnyContractAsync,
    executeWithSessionAsync,
    onSubmitted,
  } = params;

  if (!wallet?.encryptedPrivateKey) {
    throw new Error("Wallet not set up. Please create your wallet first.");
  }

  const publicKey =
    wallet.publicKey ?? wallet.normalizedPublicKey ?? "";
  if (!publicKey) {
    throw new Error("Wallet public key unavailable.");
  }

  const sessionDecryptKey = sessionUnlockKey ?? encryptKey;

  let raw: unknown;
  if (useSessionExecution && storedSession && sessionDecryptKey) {
    raw = await executeWithSessionAsync({
      bearerToken,
      params: {
        encryptKey: sessionDecryptKey,
        wallet: {
          publicKey,
          encryptedPrivateKey: wallet.encryptedPrivateKey,
          walletType: "CHIPI",
        },
        session: storedSession,
        calls,
      },
    });
  } else {
    raw = await callAnyContractAsync({
      bearerToken,
      params: {
        encryptKey,
        wallet: {
          publicKey,
          encryptedPrivateKey: wallet.encryptedPrivateKey,
        },
        contractAddress,
        calls,
      },
    });
  }

  if (typeof raw !== "string" || !raw.startsWith("0x") || raw.length < 10) {
    throw new Error(`Invalid transaction response: ${JSON.stringify(raw)}`);
  }

  const txHash = raw;
  onSubmitted?.(txHash);

  try {
    const receipt = await starknetProvider.waitForTransaction(txHash, {
      retryInterval: 3000,
    });
    const executionStatus =
      (receipt as { execution_status?: string; status?: string }).execution_status ||
      (receipt as { status?: string }).status;
    const isReverted =
      executionStatus === "REVERTED" ||
      executionStatus === "REJECTED" ||
      Boolean((receipt as { revert_reason?: string }).revert_reason);

    if (isReverted) {
      const revertReason =
        (receipt as { revert_reason?: string }).revert_reason ||
        `Transaction reverted (${executionStatus})`;
      return { txHash, status: "reverted", revertReason };
    }

    return { txHash, status: "confirmed" };
  } catch (receiptError: unknown) {
    const raw =
      receiptError instanceof Error
        ? receiptError.message
        : "Transaction failed on L2";
    const reason = formatStarknetInfrastructureError(raw, {
      txHash,
      operation: "Confirming your transaction on Starknet",
    });
    return { txHash, status: "reverted", revertReason: reason };
  }
}

/** Same rule as useChipiWalletPanel — READY wallets use a different signing path */
export function walletSupportsSessionKeys(
  wallet: WalletData | null | undefined
): boolean {
  return !wallet || wallet.walletType !== "READY";
}
