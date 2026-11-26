import { EditionsPage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Limited Edition NFT | Launchpad");
const description = msg("Create an immutable, licensed NFT in multiple copies for your audience to collect and trade.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/nfteditions",
  title,
  description,
});

export default function NFTEditionsPage() {
  return <EditionsPage />;
}
