import { ClaimPageClient } from "./claim-page-client";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Claims");
const description = msg("Claim what's yours on Medialane.");

export const generateMetadata = pageMetadata({
  path: "/claim",
  title,
  description,
});

export default function ClaimPage() {
  return <ClaimPageClient />;
}
