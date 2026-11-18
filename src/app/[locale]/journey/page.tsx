import { JourneyContent } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Your journey");
const description = msg("Every level, every badge, every way to earn XP on Medialane — the whole system, explained.");

export const generateMetadata = pageMetadata({
  path: "/journey",
  title,
  description,
});

export default function JourneyPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8">
      <JourneyContent startHint="Get started in seconds." />
    </div>
  );
}
