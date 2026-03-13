"use client";

import Link from "next/link";
import { Hero } from "./hero";
import { BentoSection } from "./bento-section";
import { FeedSection } from "./feed-section";

export function DiscoverPage() {
  return (
    <div className="space-y-10 pb-0">
      <Hero />
      <BentoSection />
      <FeedSection />
      <footer className="mt-16 py-8 border-t border-border">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm">Medialane</p>
            <p className="text-xs text-muted-foreground">Create, license &amp; trade IP on Starknet</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/marketplace" className="hover:text-foreground transition-colors">Trade</Link>
            <Link href="/launchpad" className="hover:text-foreground transition-colors">Launch</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
