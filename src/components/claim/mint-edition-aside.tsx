import { Sparkles, Layers, FileCheck, Gift } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";

/** Right-rail content for /launchpad/nfteditions/[contract]/mint. */
export function MintEditionAside() {
  return (
    <ClaimRail
      included={[
        { icon: Sparkles, title: "A new piece", desc: "Mint a new artwork into your collection." },
        { icon: Layers, title: "As many copies as you want", desc: "Choose how many editions to mint." },
        { icon: FileCheck, title: "Recorded as yours", desc: "Authorship is saved permanently with the piece." },
      ]}
      steps={[
        "Add the piece's details and image",
        "Choose how many editions",
        "Mint it — it's free",
      ]}
      trustIcon={Gift}
      trustLead="It's yours, free."
      trust="You keep full ownership — Medialane never takes custody, and there are no fees to mint."
    />
  );
}
