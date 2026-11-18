import { CollectionsPage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Collections");
const description = msg("Browse all onchain IP collections on Medialane — NFT, art, audio, video, and more on Starknet.");

export const generateMetadata = pageMetadata({
  path: "/collections",
  title,
  description,
  imageAlt: msg("Medialane Collections"),
});

export default function CollectionsRoute() {
  return <CollectionsPage />;
}
