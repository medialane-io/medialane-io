import { Coins } from "lucide-react";
import { ClaimRouteShell } from "@medialane/ui";
import { ClaimGate } from "@/components/claim/claim-gate";
import { ClaimCollectionPanel } from "@/components/claim/claim-collection-panel";
import { PageAside } from "@/components/claim/page-aside";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Claim memecoin");
const description = msg("Bring a Starknet coin to Medialane.");

export const generateMetadata = pageMetadata({
  path: "/claim/memecoin",
  title,
  description,
  imageAlt: msg("Claim a memecoin on Medialane"),
});

export default function MemecoinClaimPage() {
  return (
    <ClaimRouteShell
      icon={<Coins className="h-4 w-4 text-white" />}
      title={msg("Claim a memecoin")}
      subtitle={msg("Add a Starknet coin for trading.")}
      aside={<PageAside kind="claimMemecoin" />}
    >
      <ClaimGate>
        <ClaimCollectionPanel kind="coin" />
      </ClaimGate>
    </ClaimRouteShell>
  );
}
