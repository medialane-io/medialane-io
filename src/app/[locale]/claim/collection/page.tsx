import { FolderInput, Globe } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";
import { ClaimRouteShell } from "@medialane/ui";
import { ClaimGate } from "@/components/claim/claim-gate";
import { ClaimCollectionPanel } from "@/components/claim/claim-collection-panel";
import { PageAside } from "@/components/claim/page-aside";

const title = msg("Claim a collection");
const description = msg("Link a Starknet collection to your profile.");

export const generateMetadata = pageMetadata({
  path: "/claim/collection",
  title,
  description,
});

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
      title={msg("Claim a collection")}
      subtitle={msg("Link a Starknet collection to your profile.")}
      headerAccessory={urlPill}
      aside={<PageAside kind="claimCollection" />}
    >
      <ClaimGate>
        <ClaimCollectionPanel helperText="Paste the Starknet ERC-721 contract address you own — we verify ownership on-chain before it goes live." />
      </ClaimGate>
    </ClaimRouteShell>
  );
}
