import { MARKETPLACE_721_CONTRACT, MARKETPLACE_1155_CONTRACT } from "@/lib/constants";
import { isErc1155Standard } from "./token-standard";

export function getMarketplaceContractForStandard(standard: string | null | undefined): `0x${string}` {
  return isErc1155Standard(standard)
    ? MARKETPLACE_1155_CONTRACT
    : MARKETPLACE_721_CONTRACT;
}
