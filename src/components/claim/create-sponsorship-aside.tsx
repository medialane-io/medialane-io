import { Handshake, ShieldCheck, Coins, Gift } from "lucide-react";
import { ClaimRail } from "@medialane/ui";

export function CreateSponsorshipAside() {
  return (
    <ClaimRail
      included={[
        { icon: Handshake, title: "Direct settlement", desc: "Sponsor pays you directly — no escrow, no middleman." },
        { icon: ShieldCheck, title: "Owner-verified", desc: "You must own the asset, checked on-chain when you create and when you accept." },
        { icon: Coins, title: "Open bidding", desc: "Any sponsor can bid, or invite one specific sponsor." },
      ]}
      steps={[
        "Choose your terms — an asset you own, or one you'd like to sponsor",
        "The other side responds — bids come in, or a proposal is accepted",
        "Settle instantly: they receive a license, you receive payment",
      ]}
      trustIcon={Gift}
      trustLead="No escrow, ever."
      trust="The contract never holds funds — settlement is direct, sponsor to author."
    />
  );
}
