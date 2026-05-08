import type { Metadata } from "next";
import { LaunchpadContent } from "./launchpad-content";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Launchpad",
  description: "Creator hub — launch drops, mint assets, and deploy collections on Medialane.",
  alternates: canonical("/launchpad"),
};

export default function LaunchpadPage() {
  return <LaunchpadContent />;
}
