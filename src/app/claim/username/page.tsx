import type { Metadata } from "next";
import { AtSign } from "lucide-react";
import { canonical } from "@/lib/seo";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { UsernameClaimPanel } from "@/components/shared/username-claim-panel";

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
      icon={<AtSign className="h-4 w-4 text-brand-blue" />}
      title="Claim your Username"
      subtitle="Reserve your creator URL at medialane.io/creator/yourname."
      redirectUrl="/claim/username"
    >
      <UsernameClaimPanel />
    </ClaimRouteShell>
  );
}
