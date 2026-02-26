import type { Metadata } from "next";
import { ListingsGrid } from "@/components/marketplace/listings-grid";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Browse and buy IP assets on Medialane.",
};

export default function MarketplacePage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Marketplace</span>
        </div>
        <h1 className="text-3xl font-bold">Discover IP Assets</h1>
        <p className="text-muted-foreground">
          Browse, buy, and license creative works on Starknet — gasless for everyone.
        </p>
      </div>

      {/* Grid — no filter sidebar for initial release, keep it simple */}
      <ListingsGrid />
    </div>
  );
}
