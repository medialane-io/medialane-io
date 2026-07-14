import type { Metadata } from "next";
import { TicketsContent } from "./tickets-content";

export const metadata: Metadata = {
  title: "IP Tickets",
  description: "Create verifiable on-chain tickets — mint to your audience, trade like any collection.",
};

export default function TicketsPage() {
  return <TicketsContent />;
}
