import { WelcomePageClient } from "./welcome-page-client";
import { msg } from "@medialane/ui/i18n";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = pageMetadata({
  path: "/welcome",
  title: msg("Welcome to Medialane"),
  description: msg("Your account is live onchain. Explore the marketplace or create your first asset."),
  robots: { index: false },
  social: false,
});

export default function WelcomePage() {
  return <WelcomePageClient />;
}
