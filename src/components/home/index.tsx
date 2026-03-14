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
    <div className="pb-24">
      {/* Full-bleed hero — break out of sidebar padding */}
      <div className="-mx-4 sm:mx-0">
        <HeroSlider />
      </div>

      {/* Airdrop — full-bleed cinematic dark section */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-10 mt-6">
        <AirdropSection />
      </div>

      {/* Genesis Mint — padded, generous vertical space */}
      <div className="px-4 sm:px-6 lg:px-10 mt-24">
        <GenesisMintSection />
      </div>

      {/* Trending Collections — full-width for the horizontal scroller */}
      <div className="mt-24">
        <TrendingCollections />
      </div>

      {/* New on Marketplace — padded */}
      <div className="px-4 sm:px-6 lg:px-10 mt-24">
        <NewOnMarketplace />
      </div>

      {/* Community Activity — padded */}
      <div className="px-4 sm:px-6 lg:px-10 mt-24">
        <CommunityActivity />
      </div>

      {/* Learn & Docs — padded */}
      <div className="px-4 sm:px-6 lg:px-10 mt-24">
        <LearnDocsCta />
      </div>
    </div>
  );
}
