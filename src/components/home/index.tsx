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
    // overflow-x-hidden on root prevents ANY section from causing page-level horizontal scroll
    <div className="pb-24 overflow-x-hidden">
      {/* Hero — <main> has zero padding so this is naturally full-bleed */}
      <HeroSlider />

      {/* Airdrop — full-bleed dark panel, manages its own internal padding */}
      <AirdropSection />

      {/* Padded content sections */}
      <div className="px-4 sm:px-6 lg:px-10 space-y-20 mt-20">
        <GenesisMintSection />
        <TrendingCollections />
        <NewOnMarketplace />
        <CommunityActivity />
        <LearnDocsCta />
      </div>
    </div>
  );
}
