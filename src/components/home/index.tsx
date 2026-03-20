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
    <div className="pb-20">
      {/* Hero — <main> has zero padding so this is naturally full-bleed */}
      <HeroSlider />

      {/* Airdrop — full-bleed dark panel, manages its own internal padding */}
      <AirdropSection />

      {/* Padded content sections — max-w + mx-auto ensures equal margins on both sides */}
      <div className="px-4 sm:px-6 lg:px-8 space-y-20 mt-20">
        
        <TrendingCollections />
        <NewOnMarketplace />
        <GenesisMintSection />
        <CommunityActivity />
        <LearnDocsCta />
      </div>
    </div>
  );
}
