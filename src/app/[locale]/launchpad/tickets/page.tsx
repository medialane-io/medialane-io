import { ServiceCollectionsPage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("IP Tickets");
const description = msg("Create verifiable on-chain tickets — mint to your audience, trade like any collection.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/tickets",
  title,
  description,
});

export default function TicketsPage() {
  return <ServiceCollectionsPage kind="tickets" />;
}
