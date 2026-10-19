"use client";

import { DropCreate, PageContainer } from "@medialane/ui";

export default function CreateDropPage() {
  return (
    <PageContainer className="pt-10 pb-24 space-y-6">
      <h1 className="text-2xl font-semibold">Create a drop</h1>
      <DropCreate />
    </PageContainer>
  );
}
