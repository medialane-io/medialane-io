import { LaunchpadContent } from "./launchpad-content";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Launchpad");
const description = msg("Create NFTs, collections and coins on Medialane.");

export const generateMetadata = pageMetadata({
  path: "/launchpad",
  title,
  description,
});

export default function LaunchpadPage() {
  return <LaunchpadContent />;
}
