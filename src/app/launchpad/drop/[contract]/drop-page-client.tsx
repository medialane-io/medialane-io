"use client";

import { useSearchParams } from "next/navigation";
import { DropPage, PageContainer } from "@medialane/ui";
import { feeConfig } from "@/lib/fee";
import { useDropApp } from "@/components/launchpad/use-drop-app";

export default function DropDetailPage({ contract }: { contract: string }) {
  const app = useDropApp();
  const tab = useSearchParams().get("tab") ?? undefined;
  return (
    <PageContainer className="pt-10 pb-16">
      <DropPage {...app} contract={contract} feeConfig={feeConfig} initialTab={tab} portfolioHref="/portfolio" />
    </PageContainer>
  );
}
