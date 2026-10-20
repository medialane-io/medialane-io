import { Suspense } from "react";
import { SearchPage } from "@medialane/ui";

export default function Page() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
