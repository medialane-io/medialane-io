import { Gem, Scale, LayoutGrid, Gift } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";

/** Right-rail content for /create/asset. */
export function CreateAssetAside() {
  return (
    <ClaimRail
      included={[
        { icon: Gem, title: "A unique piece", desc: "Mint your work as a one-of-a-kind asset." },
        { icon: Scale, title: "Licensing you control", desc: "Set exactly how others can use it." },
        { icon: LayoutGrid, title: "On your profile", desc: "It shows up on your creator profile and collection." },
      ]}
      steps={[
        "Upload your work and add details",
        "Choose your licensing terms",
        "Mint it — it's free",
      ]}
      trustIcon={Gift}
      trustLead="It's yours, free."
      trust="You own it — Medialane never takes custody, and authorship is recorded permanently."
    />
  );
}
