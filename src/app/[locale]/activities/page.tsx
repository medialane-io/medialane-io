import { ActivitiesPage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Activities");
const description = msg("Global marketplace activity on Medialane.");

export const generateMetadata = pageMetadata({
  path: "/activities",
  title,
  description,
});

export default function ActivitiesRoute() {
  return <ActivitiesPage />;
}
