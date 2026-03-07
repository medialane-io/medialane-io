"use client";

import { useUser } from "@clerk/nextjs";
import { OffersTable } from "@/components/portfolio/offers-table";

export default function PortfolioOffersPage() {
  const { user } = useUser();
  const address = user?.publicMetadata?.publicKey as string | undefined;
  return <OffersTable address={address!} />;
}
