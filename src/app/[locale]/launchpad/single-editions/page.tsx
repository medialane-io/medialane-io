import { SingleEditionMint } from "@medialane/ui";
import { PageAside } from "@medialane/ui/page-aside";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Single NFT | Launchpad");
const description = msg("Create an immutable NFT with licensing for your content.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/single-editions",
  title,
  description,
});

export default function SingleEditionsPage() {
  return <SingleEditionMint aside={<PageAside kind="asset" />} />;
}
