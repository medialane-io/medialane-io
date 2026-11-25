import { SingleEditionMint } from "@medialane/ui";
import { CreateAside } from "@medialane/ui/create-aside";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Publish a work | Launchpad");
const description = msg("Publish a single-copy work.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/single-editions",
  title,
  description,
});

export default function SingleEditionsPage() {
  return <SingleEditionMint aside={<CreateAside kind="asset" />} />;
}
