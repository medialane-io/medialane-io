import { RemixBrowsePage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Remix | Launchpad");
const description = msg("Pick a work that is open to remixing and create a licensed derivative with attribution to the original creator.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/remix",
  title,
  description,
});

export default function RemixPage() {
  return <RemixBrowsePage />;
}
