import { Layers, LayoutGrid, Plus, Gift } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";

/** Right-rail content for /create/collection. */
export function CreateCollectionAside() {
  return (
    <ClaimRail
      included={[
        { icon: Layers, title: "Your own collection", desc: "A collection that's yours to keep — you own it." },
        { icon: LayoutGrid, title: "A branded page", desc: "Custom cover, banner, name and a shareable URL." },
        { icon: Plus, title: "Mint your work into it", desc: "Add as many pieces as you like, whenever you like." },
      ]}
      steps={[
        "Add a name, symbol and image",
        "Publish it — it's free",
        "Start minting your work",
      ]}
      trustIcon={Gift}
      trustLead="It's yours, free."
      trust="You own the collection — Medialane never takes custody, and there are no fees to publish."
    />
  );
}
