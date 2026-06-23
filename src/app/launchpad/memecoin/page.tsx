import type { Metadata } from "next";
import { Coins } from "lucide-react";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { ClaimCollectionPanel } from "@/components/claim/claim-collection-panel";
import { ClaimMemecoinAside } from "@/components/claim/claim-memecoin-aside";

export const metadata: Metadata = {
  title: "Claim Memecoin",
  description: "Already launched a coin on Starknet? Bring it to Medialane so people can discover and trade it.",
  openGraph: {
    title: "Claim Memecoin | Medialane",
    description: "Already launched a coin on Starknet? Bring it to Medialane so people can discover and trade it.",
    url: "/launchpad/memecoin",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Claim a Memecoin on Medialane" }],
  },
};

export default function MemecoinClaimPage() {
  return (
    <ClaimRouteShell
      icon={<Coins className="h-4 w-4 text-white" />}
      title="Claim a Memecoin"
      subtitle="Already launched a coin on Starknet? Add it so people can discover and trade it."
      redirectUrl="/launchpad/memecoin"
      aside={<ClaimMemecoinAside />}
    >
      <ClaimCollectionPanel helperText="Paste your coin's Starknet contract address — our team gives it a quick review before it goes live." />
    </ClaimRouteShell>
  );
}
