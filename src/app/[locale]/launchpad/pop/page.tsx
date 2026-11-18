import { PopContent } from "./pop-content";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Proof of Participation");
const description = msg("Claim your on-chain credential for events, bootcamps, and workshops.");

export const generateMetadata = pageMetadata({
  path: "/launchpad/pop",
  title,
  description,
});

export default function PopPage() {
  return <PopContent />;
}
