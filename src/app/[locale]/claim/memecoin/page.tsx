import { Coins } from "lucide-react";
import { ClaimRouteShell } from "@medialane/ui";
import { ClaimGate } from "@/components/claim/claim-gate";
import { ClaimCollectionPanel } from "@/components/claim/claim-collection-panel";
import { PageAside } from "@/components/claim/page-aside";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Claim Memecoin");
const description = msg("Already launched a coin on Starknet? Bring it to Medialane so people can discover and trade it.");

export const generateMetadata = pageMetadata({
  path: "/claim/memecoin",
  title,
  description,
  imageAlt: msg("Claim a Memecoin on Medialane"),
});

export default function MemecoinClaimPage() {
  return (
    <ClaimRouteShell
      icon={<Coins className="h-4 w-4 text-white" />}
      title="Claim a Memecoin"
      subtitle="Already launched a coin on Starknet? Add it so people can discover and trade it."
      aside={<PageAside kind="claimMemecoin" />}
    >
      <ClaimGate>
        <ClaimCollectionPanel kind="coin" helperText="Paste your coin's Starknet contract address. If your wallet owns the contract it goes live immediately." />
      </ClaimGate>
    </ClaimRouteShell>
  );
}
