import { EditionsPage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Limited Editions | Launchpad");
const description = msg("Mint numbered copies of your work into an editions collection you own, or create a new collection.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/nfteditions",
  title,
  description,
});

export default function NFTEditionsPage() {
  return <EditionsPage />;
}
