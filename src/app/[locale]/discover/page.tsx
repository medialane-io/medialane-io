import { DiscoverPage } from "@/components/discover";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Discover");
const description = msg("Explore trending assets and creators on Medialane.");

export const generateMetadata = pageMetadata({
  path: "/discover",
  title,
  description,
  imageAlt: msg("Discover on Medialane"),
});

export default function DiscoverPreviewPage() {
  return <DiscoverPage />;
}
