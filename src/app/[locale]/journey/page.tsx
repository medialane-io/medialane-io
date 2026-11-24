import { JourneyContent } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Your journey");
const description = msg("How levels and badges work on Medialane.");

export const generateMetadata = pageMetadata({
  path: "/journey",
  title,
  description,
});

export default function JourneyPage() {
  return <JourneyContent startHint={msg("Get started in seconds.")} />;
}
