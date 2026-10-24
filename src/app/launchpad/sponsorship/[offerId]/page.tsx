"use client";

import { use } from "react";
import { SponsorshipOfferPage } from "@medialane/ui";

export default function SponsorshipOfferRoute({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = use(params);
  return <SponsorshipOfferPage offerId={offerId} />;
}
