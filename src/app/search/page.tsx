import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPage } from "@medialane/ui";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Search",
  description: "Search assets, collections and creators on Medialane.",
  alternates: canonical("/search"),
};

export default function Page() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
