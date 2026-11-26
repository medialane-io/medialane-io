"use client";

import { CoinCreate } from "@medialane/ui";
import { PageAside } from "@medialane/ui/page-aside";

export default function CoinCreatePage() {
  return <CoinCreate aside={<PageAside kind="coin" />} tradeHref={(address) => `https://starknet.medialane.io/collections/${address}`} />;
}
