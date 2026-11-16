import { Award, Ticket, LayoutGrid, Gift } from "lucide-react";
import { ClaimRail } from "@medialane/ui/claim-rail";

export function CreatePopAside() {
  return (
    <ClaimRail
      included={[
        { icon: Award, title: "An immutable certificate", desc: "A digital asset certificate for authenticity." },
        { icon: Ticket, title: "Theirs to keep", desc: "It stays in their account — a real record they were there." },
        { icon: LayoutGrid, title: "A branded event page", desc: "A page for the event, with a shareable claim link." },
      ]}
      steps={[
        "Add the event details and image",
        "Publish it — it's free",
        "Share the claim link with attendees",
      ]}
      trustIcon={Gift}
      trustLead="Owned outright, free."
      trust="The creator owns the collection — Medialane never takes custody, and there are no fees to publish."
    />
  );
}
