import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Rocket, Star, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Launchpad",
  description: "Creator drops and featured launches on Medialane.",
};

export default function LaunchpadPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Rocket className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Launchpad</span>
        </div>
        <h1 className="text-4xl font-bold">Creator Drops</h1>
        <p className="text-muted-foreground">
          Featured drops from verified creators. Collect limited IP assets before they sell out.
        </p>
      </div>

      {/* Coming soon */}
      <div className="max-w-lg mx-auto rounded-2xl border border-dashed border-border p-12 text-center space-y-4">
        <div className="flex justify-center gap-2">
          <Star className="h-6 w-6 text-yellow-400" />
          <Users className="h-6 w-6 text-primary" />
          <Rocket className="h-6 w-6 text-purple-400" />
        </div>
        <h2 className="text-xl font-bold">Drops coming soon</h2>
        <p className="text-sm text-muted-foreground">
          The launchpad is being curated. Apply to feature your drop or browse the marketplace in the meantime.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button asChild>
            <Link href="/marketplace">Browse marketplace</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/create/asset">Create an asset</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
