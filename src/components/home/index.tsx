"use client";

import { HeroSlider } from "./hero-slider";
import { AirdropSection } from "./airdrop-section";
import { TrendingCollections } from "./trending-collections";
import { NewOnMarketplace } from "./new-on-marketplace";
import { CommunityActivity } from "./community-activity";
import { LearnDocsCta } from "./learn-docs-cta";
import { IpTypeNav } from "./ip-type-nav";

export function HomePage() {
  return (
    <div className="pb-20">
      {/* Hero — <main> has zero padding so this is naturally full-bleed */}
      <HeroSlider />

      {/* Airdrop — full-bleed dark panel, manages its own internal padding */}
      <AirdropSection />

      {/* Padded content sections */}
      <div className="container mx-auto px-4 sm:px-6 space-y-20 mt-20">
        <TrendingCollections />
        <NewOnMarketplace />
        <CommunityActivity />
        {/* <IpTypeNav /> */}{/* TODO: uncomment when more asset variety is available */}
        <LearnDocsCta />
      </div>
    </div>
  );
}
