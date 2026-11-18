import type { Metadata } from "next";
import { msg } from "@medialane/ui/i18n";

export const metadata: Metadata = {
  title: msg("Search"),
  description: msg("Search for tokens and collections on Medialane."),
  robots: { index: false },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
