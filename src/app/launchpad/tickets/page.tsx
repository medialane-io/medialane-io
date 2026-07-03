import type { Metadata } from "next";
import { TicketsContent } from "./tickets-content";

export const metadata: Metadata = {
  title: "IP Tickets | Medialane",
  description: "Sell verifiable, redeemable tickets for events and experiences.",
};

export default function TicketsPage() {
  return <TicketsContent />;
}
