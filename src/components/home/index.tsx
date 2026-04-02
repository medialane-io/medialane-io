"use client";

import { HeroSlider } from "./hero-slider";
import { AirdropSection } from "./airdrop-section";
import { TrendingCollections } from "./trending-collections";
import { NewOnMarketplace } from "./new-on-marketplace";
import { ActivityTicker } from "@/components/shared/activity-ticker";

export function HomePage() {
  return (
    <div className="pb-20">
      {/* Hero — full-bleed collection slider */}
      <HeroSlider />

      {/* Live market ticker */}
      <div className="container mx-auto px-4 sm:px-6 pt-6">
        <ActivityTicker limit={14} />
      </div>

      {/* Padded content sections */}
      <div className="container mx-auto px-4 sm:px-6 space-y-20 mt-16">
        <TrendingCollections />
        <NewOnMarketplace />
        <AirdropSection />
      </div>
    </div>
  );
}
