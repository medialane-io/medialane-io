import { uint256 } from "starknet";
import { ChainToken, TransferHookInput, WalletData } from "@chipi-stack/types";
import { SUPPORTED_TOKENS } from "@/lib/constants";
import { parseUsdcHumanToBaseUnits } from "@/lib/chipi/parse-usdc-amount";

export async function executeOwnerTransfer(params: {
  walletAddress: string | null;
  wallet: WalletData | null;
  getBearerToken: () => Promise<string | null>;
  capCleared: boolean;
  hasActiveSession: boolean;
  setupSession: (pin: string) => Promise<unknown>;
  derivedEncryptKey: string;
  usePasskeyForChipi: boolean;
  amount: string;
  toAddress: string;
  userId: string | null;
  transferAsync: (args: {
    bearerToken: string;
    params: TransferHookInput;
  }) => Promise<string | unknown>;
}): Promise<string | undefined> {
  const {
    walletAddress,
    wallet,
    getBearerToken,
    capCleared,
    hasActiveSession,
    setupSession,
    derivedEncryptKey,
    usePasskeyForChipi,
    amount,
    toAddress,
    userId,
    transferAsync,
  } = params;

  if (!walletAddress || !wallet) {
    throw new Error("Wallet not found. Please create a wallet first.");
  }

  const bearerToken = await getBearerToken();
  if (!bearerToken) throw new Error("Not authenticated. Please sign in again.");

  if (capCleared || !hasActiveSession) {
    await setupSession(derivedEncryptKey);
  }

  const publicKey = wallet.publicKey ?? wallet.normalizedPublicKey ?? walletAddress;

  const resultTxHash = await transferAsync({
    bearerToken,
    params: {
      amount: Number(amount),
      recipient: toAddress,
      token: ChainToken.USDC,
      encryptKey: derivedEncryptKey,
      usePasskey: usePasskeyForChipi,
      ...(usePasskeyForChipi ? { externalUserId: userId ?? undefined } : {}),
      wallet: {
        publicKey,
        encryptedPrivateKey: wallet.encryptedPrivateKey,
      },
    } as TransferHookInput,
  });

  return typeof resultTxHash === "string" ? resultTxHash : undefined;
}

export async function executeSessionTransfer(params: {
  walletAddress: string | null;
  wallet: WalletData | null;
  storedSession: unknown | null;
  getBearerToken: () => Promise<string | null>;
  amount: string;
  toAddress: string;
  encryptKeyForSession: string;
  executeWithSessionAsync: (args: {
    bearerToken: string;
    params: {
      encryptKey: string;
      wallet: {
        publicKey: string;
        encryptedPrivateKey: string;
        walletType: "CHIPI";
      };
      session: unknown;
      calls: Array<{
        contractAddress: string;
        entrypoint: string;
        calldata: string[];
      }>;
    };
  }) => Promise<unknown>;
}) {
  const {
    walletAddress,
    wallet,
    storedSession,
    getBearerToken,
    amount,
    toAddress,
    encryptKeyForSession,
    executeWithSessionAsync,
  } = params;

  if (!walletAddress || !wallet) {
    throw new Error("Wallet not found. Please create a wallet first.");
  }
  if (!storedSession) {
    throw new Error("No signing session on file. Register one in Remember session settings.");
  }

  const bearerToken = await getBearerToken();
  if (!bearerToken) throw new Error("Not authenticated. Please sign in again.");

  const usdcToken = SUPPORTED_TOKENS.find((t) => t.symbol === "USDC");
  if (!usdcToken?.address) throw new Error("USDC is not configured.");

  const baseUnits = parseUsdcHumanToBaseUnits(amount);
  const u256Parts = uint256.bnToUint256(baseUnits);

  await executeWithSessionAsync({
    bearerToken,
    params: {
      encryptKey: encryptKeyForSession,
      wallet: {
        publicKey: wallet.publicKey,
        encryptedPrivateKey: wallet.encryptedPrivateKey,
        walletType: "CHIPI",
      },
      session: storedSession,
      calls: [
        {
          contractAddress: usdcToken.address,
          entrypoint: "transfer",
          calldata: [toAddress, u256Parts.low.toString(), u256Parts.high.toString()],
        },
      ],
    },
  });
}

