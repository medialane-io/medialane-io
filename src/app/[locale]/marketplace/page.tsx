import MarketplacePageClient from "./marketplace-page-client";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Marketplace");
const description = msg("Buy and license digital assets on Medialane.");

export const generateMetadata = pageMetadata({
  path: "/marketplace",
  title,
  description,
  imageAlt: msg("Medialane Marketplace"),
});

export default function MarketplacePage() {
  return <MarketplacePageClient />;
}
