import { Lock } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";

/** Right-rail panels for /launchpad/coin/create — shown under the live preview.
 *  No "What's included" panel (the live preview fills that role). */
export function CreateCoinAside() {
  return (
    <ClaimRail
      steps={[
        "Design your coin — name, image and story",
        "Set the economics — supply, price and your share",
        "Launch — gasless, liquidity locked forever",
      ]}
      trustIcon={Lock}
      trustLead="Locked forever."
      trust="Liquidity is locked permanently — nobody can pull it, not even Medialane. It's a standard coin, fully yours."
    />
  );
}
