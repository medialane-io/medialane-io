import { Ticket, ChevronRight } from "lucide-react";
import { ClaimRail } from "@medialane/ui";

/** Right-rail content for /launchpad/tickets/create. */

export function CreateTicketAside() {
  return (
    <ClaimRail
      included={[
        { icon: Ticket, title: "One collection, many tickets", desc: "Create as many tickets as you need without publishing again." },
        { icon: ChevronRight, title: "You keep full control", desc: "Only you can create and mint tickets." },
      ]}
      steps={[
        "Create your tickets collection — set name, symbol, and cover image",
        "Create tickets — each gets its own supply and optional validity window",
        "Mint tickets to your audience directly from your collection page",
      ]}
      trustIcon={Ticket}
      trustLead="Your tickets, your rules."
      trust="Only you can create and mint tickets. Holders keep their tickets forever."
    />
  );
}
