import { Suspense } from "react";
import { SearchPage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

export const generateMetadata = pageMetadata({
  path: "/search",
  title: msg("Search"),
  description: msg("Search Medialane."),
  social: false,
});

export default function Page() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
