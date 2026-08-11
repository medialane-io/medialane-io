import type { Metadata } from "next";
import { JourneyContent } from "./journey-content";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Your Journey";
const description = "Every level, every badge, every way to earn XP on Medialane — the whole system, explained.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/journey"),
  ...buildSocialMetadata({ title, description }),
};

export default function JourneyPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8">
      <JourneyContent />
    </div>
  );
}
