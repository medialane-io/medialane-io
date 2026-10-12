"use client";

import { MyDrops, PageContainer } from "@medialane/ui";
import { useDropApp } from "@/components/launchpad/use-drop-app";

export default function MyDropsPage() {
  const app = useDropApp();
  return (
    <PageContainer className="pt-10 pb-16 space-y-6">
      <h1 className="text-2xl font-semibold">My drops</h1>
      <MyDrops getClient={app.getClient} walletAddress={app.walletAddress} onRequireWallet={app.onRequireWallet} />
    </PageContainer>
  );
}
