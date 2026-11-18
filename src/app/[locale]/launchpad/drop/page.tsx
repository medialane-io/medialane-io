import { DropsPage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Collection drop");
const description = msg("Mint limited edition drops. Set your supply cap, open a mint window, and let your community collect.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/drop",
  title,
  description,
});

export default function DropPage() {
  return <DropsPage />;
}
