import type { Metadata } from "next";
import { PopContent } from "./pop-content";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Proof of Participation | Medialane",
  description: "Claim your on-chain credential for events, bootcamps, and workshops.",
  alternates: canonical("/launchpad/pop"),
};

export default function PopPage() {
  return <PopContent />;
}
