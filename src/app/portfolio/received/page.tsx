"use client";

import { useUser } from "@clerk/nextjs";
import { ReceivedOffersTable } from "@/components/portfolio/received-offers-table";

export default function PortfolioReceivedPage() {
  const { user } = useUser();
  const address = user?.publicMetadata?.publicKey as string | undefined;
  return <ReceivedOffersTable address={address!} />;
}
