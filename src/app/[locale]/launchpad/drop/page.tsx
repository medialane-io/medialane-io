import { DropsPage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Collection drop");
const description = msg("Launch a limited edition drop.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/drop",
  title,
  description,
});

export default function DropPage() {
  return <DropsPage />;
}
