"use client";

import { useSearchParams } from "next/navigation";
import { DropPage, PageContainer } from "@medialane/ui";

export default function DropDetailPage({ contract }: { contract: string }) {
  const tab = useSearchParams().get("tab") ?? undefined;
  return (
    <PageContainer className="pt-10 pb-16">
      <DropPage contract={contract} initialTab={tab} portfolioHref="/portfolio" />
    </PageContainer>
  );
}
