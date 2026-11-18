import { RewardsPage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Rewards");
const description = msg("What Medialane gives back to everyone creating, collecting, and taking part.");

export const generateMetadata = pageMetadata({
  path: "/rewards",
  title,
  description,
});

export default RewardsPage;
