import MarketplacePageClient from "./marketplace-page-client";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Marketplace");
const description = msg("Browse, buy, and license digital assets on the Medialane marketplace, permissionlessly onchain.");

export const generateMetadata = pageMetadata({
  path: "/marketplace",
  title,
  description,
  imageAlt: msg("Medialane Marketplace"),
});

export default function MarketplacePage() {
  return <MarketplacePageClient />;
}
