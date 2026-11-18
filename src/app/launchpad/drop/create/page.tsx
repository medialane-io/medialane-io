"use client";

import { DropCreate, PageContainer } from "@medialane/ui";
import { useT } from "@medialane/ui/i18n";

export default function CreateDropPage() {
  const t = useT();
  return (
    <PageContainer className="pt-10 pb-24 space-y-6">
      <h1 className="text-2xl font-semibold">{t("Create a drop")}</h1>
      <DropCreate />
    </PageContainer>
  );
}
