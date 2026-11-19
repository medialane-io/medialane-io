import { ActivitiesFeed, PageContainer } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";
import { getT } from "@/i18n/server";

const title = msg("Activities");
const description = msg("Global marketplace activity on Medialane.");

export const generateMetadata = pageMetadata({
  path: "/activities",
  title,
  description,
});

export default async function ActivitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const t = await getT((await params).locale);
  return (
    <PageContainer className="box-border max-w-full pt-14 pb-8 space-y-8">
      <div className="space-y-2 pt-8">
        <h1 className="text-3xl font-bold">{t("Onchain Activity")}</h1>
      </div>
      <ActivitiesFeed />
    </PageContainer>
  );
}
