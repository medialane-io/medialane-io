import type { Metadata } from "next";
import { Coins } from "lucide-react";
import { ClaimGate } from "@/components/claim/claim-gate";
import { ClaimCollectionPanel } from "@/components/claim/claim-collection-panel";

export const metadata: Metadata = {
  title: "Claim Memecoin",
  description: "Claim a coin you launched on Starknet and bring it to Medialane.",
  openGraph: {
    title: "Claim Memecoin | Medialane",
    description: "Claim a coin you launched on Starknet and bring it to Medialane.",
    url: "/launchpad/memecoin",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Claim a Memecoin on Medialane" }],
  },
};

export default function MemecoinClaimPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 pt-24 pb-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-orange-400">
          <Coins className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Claim Memecoin</span>
        </div>
        <h1 className="text-3xl font-bold">Claim your Memecoin</h1>
        <p className="text-muted-foreground">
          Add a coin you launched on Starknet (unrug or partner) to Medialane. Paste the coin
          address — coins are reviewed by our team, then appear on the Coins page and your profile.
        </p>
      </div>
      <ClaimGate>
        <ClaimCollectionPanel />
      </ClaimGate>
    </div>
  );
}
