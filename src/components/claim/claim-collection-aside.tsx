import { LayoutGrid, UserCircle, Link2 } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";

/** Right-rail content for /claim/collection. */
export function ClaimCollectionAside() {
  return (
    <ClaimRail
      included={[
        { icon: LayoutGrid, title: "Branded collection page", desc: "Custom name, cover, banner and links — all editable." },
        { icon: UserCircle, title: "Linked to your profile", desc: "It shows up on your public creator profile." },
        { icon: Link2, title: "One shareable URL", desc: "Share your collection in a single, clean link." },
      ]}
      steps={[
        "Paste your collection's contract address",
        "We verify you own it on-chain",
        "It goes live on your profile",
      ]}
      trustLead="Non-custodial."
      trust="Claiming only links your collection to your profile — Medialane never moves or holds your assets. They stay in your contract."
    />
  );
}
