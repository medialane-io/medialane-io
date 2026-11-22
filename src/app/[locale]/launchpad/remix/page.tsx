import { RemixBrowsePage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Remix | Launchpad");
const description = msg("Remix a work with credit to its creator.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/remix",
  title,
  description,
});

export default function RemixPage() {
  return <RemixBrowsePage />;
}
