import { EditionsPage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Limited Editions | Launchpad");
const description = msg("Create numbered editions of a work.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/nfteditions",
  title,
  description,
});

export default function NFTEditionsPage() {
  return <EditionsPage />;
}
