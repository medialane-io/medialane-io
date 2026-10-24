"use client";

import { CoinCreate } from "@medialane/ui";
import { CreateCoinAside } from "@/components/claim/create-coin-aside";

export default function CoinCreatePage() {
  return <CoinCreate aside={<CreateCoinAside />} tradeHref={(address) => `https://starknet.medialane.io/collections/${address}`} />;
}
