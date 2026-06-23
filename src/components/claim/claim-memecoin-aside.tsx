import { Coins, UserCircle, TrendingUp } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";

/** Right-rail content for /launchpad/memecoin. */
export function ClaimMemecoinAside() {
  return (
    <ClaimRail
      included={[
        { icon: Coins, title: "Listed on the Coins page", desc: "Where people discover and trade coins on Medialane." },
        { icon: UserCircle, title: "On your creator profile", desc: "It appears alongside the rest of your work." },
        { icon: TrendingUp, title: "Discoverable & tradable", desc: "Anyone can find your coin and trade it." },
      ]}
      steps={[
        "Paste your coin's contract address",
        "We check on-chain that you own it",
        "After a quick review, it goes live",
      ]}
      trustLead="Non-custodial."
      trust="Medialane never takes custody of your coin — claiming just links it to your account."
    />
  );
}
