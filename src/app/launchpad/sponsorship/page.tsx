import type { Metadata } from "next";
import { SponsorshipContent } from "./sponsorship-content";

export const metadata: Metadata = {
  title: "IP Sponsorship | Medialane",
  description: "Sponsorship offers and licenses anchored to Medialane assets.",
};

export default function SponsorshipPage() {
  return <SponsorshipContent />;
}
