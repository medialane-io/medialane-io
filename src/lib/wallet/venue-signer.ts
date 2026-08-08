import { typedData as starknetTypedData, type Call, type TypedData } from "starknet";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import { signWith, type SealedOwner } from "./passkey";
import { executeSponsored } from "./sponsored-invoke";

/**
 * Wraps a passkey-sealed MediaWallet as the SDK's portable `VenueSigner` —
 * the exact same interface medialane-starknet already implements for Ready/
 * Braavos/injected wallets, and the one integration point
 * `signAndExecuteIntent`/`executePrebuiltIntent` are written against.
 * Sponsored: `execute` routes through AVNU's paymaster (see design spec
 * 2026-08-08-io-sponsored-invoke-design.md) — io accounts hold zero STRK by
 * design, so every marketplace and launchpad write goes through this one
 * function to stay frictionless.
 */
export function starknetVenueSigner(sealed: SealedOwner): StarknetVenueSigner {
  return {
    address: sealed.address,
    signTypedData: (data: TypedData) =>
      signWith(sealed, starknetTypedData.getMessageHash(data, sealed.address)),
    execute: async (calls: Call[]) => {
      const result = await executeSponsored(sealed, calls);
      return { txHash: result.transactionHash };
    },
  };
}
