import type { Metadata } from "next";
import { FolderInput, Globe } from "lucide-react";
import { canonical, buildSocialMetadata } from "@/lib/seo";
import { ClaimRouteShell } from "@medialane/ui";
import { ClaimGate } from "@/components/claim/claim-gate";
import { ClaimCollectionPanel } from "@/components/claim/claim-collection-panel";
import { PageAside } from "@/components/claim/page-aside";

const title = "Claim a Collection";
const description =
  "Already deployed an ERC-721 collection on Starknet? Claim it to link it to your Medialane profile and give it a branded collection page.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/claim/collection"),
  ...buildSocialMetadata({ title, description }),
};

const urlPill = (
  <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 max-w-full">
    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
    <span className="tabular-nums text-sm text-foreground/90 truncate">medialane.io/collection/your-collection</span>
  </div>
);

export default function ClaimCollectionPage() {
  return (
    <ClaimRouteShell
      icon={<FolderInput className="h-4 w-4 text-white" />}
      title="Claim a Collection"
      subtitle="Import an existing Starknet ERC-721 collection into your Medialane profile."
      headerAccessory={urlPill}
      aside={<PageAside kind="claimCollection" />}
    >
      <ClaimGate>
        <ClaimCollectionPanel helperText="Paste the Starknet ERC-721 contract address you own — we verify ownership on-chain before it goes live." />
      </ClaimGate>
    </ClaimRouteShell>
  );
}
