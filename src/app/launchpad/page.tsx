import type { Metadata } from "next";
import { LaunchpadContent } from "./launchpad-content";

export const metadata: Metadata = {
  title: "Launchpad",
  description: "Creator hub — launch drops, mint assets, and deploy collections on Medialane.",
};

export default function LaunchpadPage() {
  return <LaunchpadContent />;
}
