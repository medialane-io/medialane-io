import { RemixBrowsePage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("NFT Remix | Launchpad");
const description = msg("Create a new NFT from an existing one, with its own license and recorded credit to the original.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/remix",
  title,
  description,
});

export default function RemixPage() {
  return <RemixBrowsePage />;
}
