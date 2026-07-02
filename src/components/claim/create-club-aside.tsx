import { Users, IdCard, LayoutGrid, Gift } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";

/** Right-rail content for /launchpad/club/create. */
export function CreateClubAside() {
  return (
    <ClaimRail
      included={[
        { icon: IdCard, title: "An on-chain membership card", desc: "Each member holds a real NFT that proves they belong." },
        { icon: Users, title: "You control who joins", desc: "Open or close joining anytime — an optional entry fee and member cap." },
        { icon: LayoutGrid, title: "A branded club page", desc: "Your club, with a shareable join link." },
      ]}
      steps={[
        "Name your club and set the rules",
        "Publish it — one transaction",
        "Share the join link with your fans",
      ]}
      trustIcon={Gift}
      trustLead="You keep the proceeds."
      trust="Entry fees flow directly to your wallet — Medialane never takes custody."
    />
  );
}
