"use client";

import { CoinCreate } from "@medialane/ui";
import { PageAside } from "@/components/claim/page-aside";

export default function CoinCreatePage() {
  return <CoinCreate aside={<PageAside kind="coin" />} tradeHref={(address) => `https://starknet.medialane.io/collections/${address}`} />;
}
