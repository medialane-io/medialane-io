import { SponsorshipContent } from "./sponsorship-content";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("IP Sponsorship");
const description = msg("Sponsorship offers and licenses for NFTs on Medialane.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/sponsorship",
  title,
  description,
});

export default function SponsorshipPage() {
  return <SponsorshipContent />;
}
