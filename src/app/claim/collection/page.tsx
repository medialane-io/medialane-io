import type { Metadata } from "next";
import { FolderInput, Globe } from "lucide-react";
import { canonical } from "@/lib/seo";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { ClaimCollectionPanel } from "@/components/claim/claim-collection-panel";
import { ClaimCollectionAside } from "@/components/claim/claim-collection-aside";

export const metadata: Metadata = {
  title: "Claim a Collection — Medialane",
  description:
    "Already deployed an ERC-721 collection on Starknet? Claim it to link it to your Medialane profile and give it a branded collection page.",
  alternates: canonical("/claim/collection"),
  openGraph: {
    title: "Claim a Collection — Medialane",
    description:
      "Import an existing Starknet ERC-721 collection into your Medialane profile.",
    type: "website",
    url: "/claim/collection",
  },
};

/** URL preview pill — the concrete payoff, shown in the header. */
const urlPill = (
  <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 max-w-full">
    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
    <span className="font-mono text-sm text-foreground/90 truncate">medialane.io/collections/your-collection</span>
  </div>
);

export default function ClaimCollectionPage() {
  return (
    <ClaimRouteShell
      icon={<FolderInput className="h-4 w-4 text-white" />}
      title="Claim a Collection"
      subtitle="Import an existing Starknet ERC-721 collection into your Medialane profile."
      redirectUrl="/claim/collection"
      headerAccessory={urlPill}
      aside={<ClaimCollectionAside />}
    >
      <ClaimCollectionPanel />
    </ClaimRouteShell>
  );
}
