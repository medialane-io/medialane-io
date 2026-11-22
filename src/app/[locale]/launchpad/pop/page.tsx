import { PopContent } from "./pop-content";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Proof of Participation");
const description = msg("Proof of attendance for events.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/pop",
  title,
  description,
});

export default function PopPage() {
  return <PopContent />;
}
