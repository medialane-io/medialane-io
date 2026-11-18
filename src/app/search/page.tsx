import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPage } from "@medialane/ui";
import { canonical } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

export const metadata: Metadata = {
  title: msg("Search"),
  description: msg("Search assets, collections and creators on Medialane."),
  alternates: canonical("/search"),
};

export default function Page() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
