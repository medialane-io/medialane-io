"use client";

import { MyDrops, PageContainer } from "@medialane/ui";
import { useT } from "@medialane/ui/i18n";

export default function MyDropsPage() {
  const t = useT();
  return (
    <PageContainer className="pt-10 pb-16 space-y-6">
      <h1 className="text-2xl font-semibold">{t("My drops")}</h1>
      <MyDrops />
    </PageContainer>
  );
}
