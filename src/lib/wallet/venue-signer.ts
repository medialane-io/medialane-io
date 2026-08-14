import { typedData as starknetTypedData, type Call, type TypedData } from "starknet";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import { signWith, type SealedOwner } from "./passkey";
import { executeSponsored } from "./sponsored-invoke";

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
