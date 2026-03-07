"use client";

import { useUser } from "@clerk/nextjs";
import { PortfolioActivity } from "@/components/portfolio/portfolio-activity";

export default function PortfolioActivityPage() {
  const { user } = useUser();
  const address = user?.publicMetadata?.publicKey as string | undefined;
  return <PortfolioActivity address={address} />;
}
