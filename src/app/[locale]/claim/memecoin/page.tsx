import { Coins } from "lucide-react";
import { ClaimRouteShell } from "@medialane/ui";
import { ClaimGate } from "@/components/claim/claim-gate";
import { ClaimCollectionPanel } from "@/components/claim/claim-collection-panel";
import { PageAside } from "@medialane/ui/page-aside";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Existing Memecoin");
const description = msg("Connect a memecoin you've already launched to your creator profile.");

export const generateMetadata = pageMetadata({
  path: "/claim/memecoin",
  title,
  description,
  imageAlt: msg("Existing Memecoin on Medialane"),
});

export default function MemecoinClaimPage() {
  return (
    <ClaimRouteShell
      icon={<Coins className="h-4 w-4 text-white" />}
      title={msg("Existing Memecoin")}
      subtitle={msg("Connect a memecoin you've already launched to your creator profile.")}
      aside={<PageAside kind="claimMemecoin" />}
    >
      <ClaimGate>
        <ClaimCollectionPanel kind="coin" />
      </ClaimGate>
    </ClaimRouteShell>
  );
}
