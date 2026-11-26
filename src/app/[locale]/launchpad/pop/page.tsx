import { PopPage } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("POP Protocol");
const description = msg("Issue soulbound certificates as lasting proof of participation and achievement.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/pop",
  title,
  description,
});

export default function PopRoute() {
  return <PopPage />;
}
