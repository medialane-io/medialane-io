"use client";

import { DropCreate, PageContainer } from "@medialane/ui";
import { useDropApp } from "@/components/launchpad/use-drop-app";

export default function CreateDropPage() {
  const app = useDropApp();
  return (
    <PageContainer className="pt-10 pb-24 space-y-6">
      <h1 className="text-2xl font-semibold">Create a drop</h1>
      <DropCreate {...app} />
    </PageContainer>
  );
}
