import { Package, Clock, LayoutGrid, Gift } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";

/** Right-rail content for /launchpad/drop/create. */
export function CreateDropAside() {
  return (
    <ClaimRail
      included={[
        { icon: Package, title: "A limited drop", desc: "Release a fixed set of unique pieces." },
        { icon: Clock, title: "A timed mint window", desc: "Collectors mint within the window you set." },
        { icon: LayoutGrid, title: "A branded drop page", desc: "Your drop, with a shareable link." },
      ]}
      steps={[
        "Add your items and details",
        "Set the price and mint window",
        "Launch it — it's free",
      ]}
      trustIcon={Gift}
      trustLead="It's yours, free."
      trust="You own the drop — Medialane never takes custody, and there are no fees to launch."
    />
  );
}
