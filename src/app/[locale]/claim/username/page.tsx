import { AtSign } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";
import { ClaimRouteShell } from "@medialane/ui";
import { ClaimGate } from "@/components/claim/claim-gate";
import { UsernameClaimSection } from "@/components/settings/username-claim-section";
import { PageAside } from "@medialane/ui/page-aside";

const title = msg("Claim your username");
const description = msg("Claim a creator username.");

export const generateMetadata = pageMetadata({
  path: "/claim/username",
  title,
  description,
});

export default function ClaimUsernamePage() {
  return (
    <ClaimRouteShell
      icon={<AtSign className="h-4 w-4 text-white" />}
      title={msg("Claim your username")}
      aside={<PageAside kind="claimUsername" />}
    >
      <ClaimGate>
        <UsernameClaimSection />
      </ClaimGate>
    </ClaimRouteShell>
  );
}
