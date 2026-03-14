"use client";

import { HeroSlider } from "./hero-slider";
import { AirdropSection } from "./airdrop-section";
import { GenesisMintSection } from "./genesis-mint-section";
import { TrendingCollections } from "./trending-collections";
import { NewOnMarketplace } from "./new-on-marketplace";
import { CommunityActivity } from "./community-activity";
import { LearnDocsCta } from "./learn-docs-cta";

export function HomePage() {
  return (
    <div className="space-y-16 pb-20">
      {/* Full-bleed slider — bleeds outside the sidebar inset padding */}
      <div className="-mx-4 sm:mx-0">
        <HeroSlider />
      </div>

      {/* All remaining sections share a max-width container */}
      <div className="container mx-auto px-4 max-w-6xl space-y-16">
        <AirdropSection />
        <GenesisMintSection />
        <TrendingCollections />
        <NewOnMarketplace />
        <CommunityActivity />
        <LearnDocsCta />
      </div>
    </div>
  );
}
