"use client";

import { CoinCreate } from "@medialane/ui";
import { CreateAside } from "@medialane/ui/create-aside";

export default function CoinCreatePage() {
  return <CoinCreate aside={<CreateAside kind="coin" />} tradeHref={(address) => `https://starknet.medialane.io/collections/${address}`} />;
}
