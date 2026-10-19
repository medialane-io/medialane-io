"use client";

import { MyDrops, PageContainer } from "@medialane/ui";

export default function MyDropsPage() {
  return (
    <PageContainer className="pt-10 pb-16 space-y-6">
      <h1 className="text-2xl font-semibold">My drops</h1>
      <MyDrops />
    </PageContainer>
  );
}
