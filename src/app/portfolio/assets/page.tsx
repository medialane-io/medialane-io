"use client";

import { useUser } from "@clerk/nextjs";
import { AssetsGrid } from "@/components/portfolio/assets-grid";

export default function PortfolioAssetsPage() {
  const { user } = useUser();
  const address = user?.publicMetadata?.publicKey as string | undefined;
  return <AssetsGrid address={address} />;
}
