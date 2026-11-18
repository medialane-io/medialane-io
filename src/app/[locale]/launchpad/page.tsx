import { LaunchpadContent } from "./launchpad-content";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Launchpad");
const description = msg("Creator hub — launch drops, mint assets, and deploy collections on Medialane.");

export const generateMetadata = pageMetadata({
  path: "/launchpad",
  title,
  description,
});

export default function LaunchpadPage() {
  return <LaunchpadContent />;
}
