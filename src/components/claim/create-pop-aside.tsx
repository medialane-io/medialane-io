import { Award, Ticket, LayoutGrid, Gift } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";

/** Right-rail content for /launchpad/pop/create. */
export function CreatePopAside() {
  return (
    <ClaimRail
      included={[
        { icon: Award, title: "A badge people can claim", desc: "Give everyone who showed up a collectible proof." },
        { icon: Ticket, title: "Theirs to keep", desc: "It stays in their wallet — a real record they were there." },
        { icon: LayoutGrid, title: "A branded event page", desc: "Your event, with a shareable claim link." },
      ]}
      steps={[
        "Add your event details and image",
        "Publish it — it's free",
        "Share the claim link with attendees",
      ]}
      trustIcon={Gift}
      trustLead="It's yours, free."
      trust="You own the collection — Medialane never takes custody, and there are no fees to publish."
    />
  );
}
