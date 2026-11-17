import type { Metadata } from "next";
import { AtSign } from "lucide-react";
import { canonical, buildSocialMetadata } from "@/lib/seo";
import { ClaimRouteShell } from "@medialane/ui";
import { ClaimGate } from "@/components/claim/claim-gate";
import { UsernameClaimSection } from "@/components/settings/username-claim-section";
import { PageAside } from "@/components/claim/page-aside";

const title = "Claim your Username";
const description =
  "Reserve your unique creator username and get a shareable creator page at medialane.io/creator/yourname.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/claim/username"),
  ...buildSocialMetadata({ title, description }),
};

export default function ClaimUsernamePage() {
  return (
    <ClaimRouteShell
      icon={<AtSign className="h-4 w-4 text-white" />}
      title="Claim your Username"
      subtitle="Reserve your creator URL at medialane.io/creator/yourname."
      aside={<PageAside kind="claimUsername" />}
    >
      <ClaimGate>
        <UsernameClaimSection />
      </ClaimGate>
    </ClaimRouteShell>
  );
}
