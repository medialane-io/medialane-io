import { erc20Balance } from "@medialane/sdk/starknet";

type BalanceProvider = Parameters<typeof erc20Balance>[0];

export interface GenesisHolding {
  owned: boolean;
  tokenId: string | null;
}

export async function readGenesisHolding(
  provider: BalanceProvider,
  contract: string,
  owner: string,
): Promise<GenesisHolding> {
  const count = await erc20Balance(provider, contract, owner);
  if (count === 0n) return { owned: false, tokenId: null };

  try {
    const [low = "0x0", high = "0x0"] = await provider.callContract(
      { contractAddress: contract, entrypoint: "token_of_owner_by_index", calldata: [owner, "0x0", "0x0"] },
      "latest",
    );
    return { owned: true, tokenId: (BigInt(low) + (BigInt(high) << 128n)).toString() };
  } catch {
    return { owned: true, tokenId: null };
  }
}
