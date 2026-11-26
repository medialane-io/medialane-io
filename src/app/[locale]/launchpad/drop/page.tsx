import { DropsPage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("NFT Drop");
const description = msg("Launch a new collection your audience can get directly from you, for free or at your price.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/drop",
  title,
  description,
});

export default function DropPage() {
  return <DropsPage />;
}
