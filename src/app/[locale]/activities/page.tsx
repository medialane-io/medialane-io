import { ActivitiesFeed, PageContainer } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Activities");
const description = msg("Global marketplace activity on Medialane.");

export const generateMetadata = pageMetadata({
  path: "/activities",
  title,
  description,
});

export default function ActivitiesPage() {
  return (
    <PageContainer className="box-border max-w-full pt-14 pb-8 space-y-8">
      <div className="space-y-2 pt-8">
        <h1 className="text-3xl font-bold">Onchain Activity</h1>
      </div>
      <ActivitiesFeed />
    </PageContainer>
  );
}
