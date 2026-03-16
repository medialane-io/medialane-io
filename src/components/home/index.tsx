"use client";

import { HeroSlider } from "./hero-slider";
import { AirdropSection } from "./airdrop-section";
import { GenesisMintSection } from "./genesis-mint-section";
import { TrendingCollections } from "./trending-collections";
import { NewOnMarketplace } from "./new-on-marketplace";
import { CommunityActivity } from "./community-activity";
import { LearnDocsCta } from "./learn-docs-cta";

/**
 * Shared horizontal padding for all padded sections.
 * Scales up at wider breakpoints so content never hugs the screen edge.
 * Matches the container rhythm used by /collections, /marketplace, etc.
 */
const SECTION_PADDING = "px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24";

export function HomePage() {
  return (
    <div className="pb-20">
      {/* Hero — <main> has zero padding so this is naturally full-bleed */}
      <HeroSlider />

      {/* Airdrop — full-bleed dark panel, manages its own internal padding */}
      <AirdropSection />

      {/* Padded content sections */}
      <div className={`${SECTION_PADDING} space-y-20 mt-20`}>
        
        <TrendingCollections />
        <NewOnMarketplace />
        <GenesisMintSection />
        <CommunityActivity />
        <LearnDocsCta />
      </div>
    </div>
  );
}
