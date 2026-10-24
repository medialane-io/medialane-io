import type { Metadata } from "next";
import { AtSign } from "lucide-react";
import { canonical } from "@/lib/seo";
import { ClaimRouteShell } from "@medialane/ui";
import { ClaimGate } from "@/components/claim/claim-gate";
import { UsernameClaimSection } from "@/components/settings/username-claim-section";
import { ClaimUsernameAside } from "@/components/claim/claim-username-aside";

export const metadata: Metadata = {
  title: "Claim your Username — Medialane",
  description:
    "Reserve your unique creator username and get a shareable creator page at medialane.io/creator/yourname.",
  alternates: canonical("/claim/username"),
  openGraph: {
    title: "Claim your Username — Medialane",
    description: "Reserve your creator page URL at medialane.io/creator/yourname.",
    type: "website",
    url: "/claim/username",
  },
};

export default function ClaimUsernamePage() {
  return (
    <ClaimRouteShell
      icon={<AtSign className="h-4 w-4 text-white" />}
      title="Claim your Username"
      subtitle="Reserve your creator URL at medialane.io/creator/yourname."
      aside={<ClaimUsernameAside />}
    >
      <ClaimGate>
        <UsernameClaimSection />
      </ClaimGate>
    </ClaimRouteShell>
  );
}
