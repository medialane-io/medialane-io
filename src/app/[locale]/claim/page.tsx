import { ClaimPageClient } from "./claim-page-client";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Claims");
const description = msg("Reserve your username, bring in a collection or a coin, or join the Creator's Airdrop on Medialane.");

export const generateMetadata = pageMetadata({
  path: "/claim",
  title,
  description,
});

export default function ClaimPage() {
  return <ClaimPageClient />;
}
