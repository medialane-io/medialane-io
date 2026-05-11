import type { Metadata } from "next";
import { WelcomePageClient } from "./welcome-page-client";

export const metadata: Metadata = {
  title: "Welcome to Medialane",
  description: "Your account is live onchain. Explore the marketplace or create your first asset.",
};

export default function WelcomePage() {
  return <WelcomePageClient />;
}
