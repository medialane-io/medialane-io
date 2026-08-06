import { typedData as starknetTypedData, type Call, type TypedData } from "starknet";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import { signWith, type SealedOwner } from "./passkey";
import { execute } from "./account-ops";

/**
 * Wraps a passkey-sealed MediaWallet as the SDK's portable `VenueSigner` —
 * the exact same interface medialane-starknet already implements for Ready/
 * Braavos/injected wallets, and the one integration point
 * `signAndExecuteIntent`/`executePrebuiltIntent` are written against.
 * Self-pay: `execute` calls the wallet's own `execute()` directly, no
 * paymaster involved.
 */
export function starknetVenueSigner(sealed: SealedOwner): StarknetVenueSigner {
  return {
    address: sealed.address,
    signTypedData: (data: TypedData) =>
      signWith(sealed, starknetTypedData.getMessageHash(data, sealed.address)),
    execute: async (calls: Call[]) => {
      const result = await execute(sealed, calls);
      return { txHash: result.transaction_hash };
    },
  };
}
