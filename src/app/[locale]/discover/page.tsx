import { DiscoverPage } from "@/components/discover";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Discover");
const description = msg("Explore trending digital assets, collections, and creators on Medialane — Creator Launchpad + NFT Marketplace.");

export const generateMetadata = pageMetadata({
  path: "/discover",
  title,
  description,
  imageAlt: msg("Discover on Medialane"),
});

export default function DiscoverPreviewPage() {
  return <DiscoverPage />;
}
