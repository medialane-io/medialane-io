import { ServiceCollectionsPage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("IP Club");
const description = msg("Membership clubs with tradable cards.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/club",
  title,
  description,
});

export default function ClubPage() {
  return <ServiceCollectionsPage kind="club" />;
}
