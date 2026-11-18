import type { Metadata } from "next";
import { WelcomePageClient } from "./welcome-page-client";
import { msg } from "@medialane/ui/i18n";

export const metadata: Metadata = {
  title: msg("Welcome to Medialane"),
  description: msg("Your account is live onchain. Explore the marketplace or create your first asset."),
  robots: { index: false },
};

export default function WelcomePage() {
  return <WelcomePageClient />;
}
