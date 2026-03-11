import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for tokens and collections on Medialane.",
  robots: { index: false },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
