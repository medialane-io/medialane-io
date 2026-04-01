import type { Metadata } from "next";
import { PopContent } from "./pop-content";

export const metadata: Metadata = {
  title: "Proof of Participation | Medialane",
  description: "Claim your on-chain credential for events, bootcamps, and workshops.",
};

export default function PopPage() {
  return <PopContent />;
}
