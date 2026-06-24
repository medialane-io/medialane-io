import { STARKNET_MARKETPLACE_721_CONTRACT, STARKNET_MARKETPLACE_1155_CONTRACT } from "@/lib/constants";
import { isErc1155Standard } from "./token-standard";

export function getMarketplaceContractForStandard(standard: string | null | undefined): `0x${string}` {
  return isErc1155Standard(standard)
    ? STARKNET_MARKETPLACE_1155_CONTRACT
    : STARKNET_MARKETPLACE_721_CONTRACT;
}
