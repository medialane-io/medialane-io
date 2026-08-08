import { FileCheck, Coins, Star } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";

/** Right-rail for /airdrop — what participants earn, how to earn more, trust. */
export function AirdropClaimRail() {
  return (
    <ClaimRail
      included={[
        {
          icon: FileCheck,
          title: "Airdrop participation",
          desc: "Secure your spot in the first distribution and every one after it.",
        },
        {
          icon: Coins,
          title: "Creator fund distributions",
          desc: "Every $1,000 the Creator's Fund reaches is split by Score Board points.",
        },
        {
          icon: Star,
          title: "Founding member status",
          desc: "Early participants are permanently recognized as founding members.",
        },
      ]}
      steps={[
        "Register your account",
        "Create or trade for a bigger share",
        "Earn from every $1,000 distribution",
      ]}
      trustLead="Non-custodial."
      trust="Your participation record only links to your account — Medialane never moves or holds your assets."
    />
  );
}
