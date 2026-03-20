"use client";

import { useSessionKey } from "@/hooks/use-session-key";
import { AssetsGrid } from "@/components/portfolio/assets-grid";
import { ChipiWalletPanel } from "@/components/wallet/chipi-wallet-panel";

export default function PortfolioAssetsPage() {
  const { walletAddress } = useSessionKey();

return (
  <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">

    <section>
      <h2 className="mb-2 text-base font-semibold">Your assets</h2>
      <AssetsGrid address={walletAddress ?? null} />
    </section>
  </main>
);
}


