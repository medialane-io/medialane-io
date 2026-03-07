"use client";

import { useUser } from "@clerk/nextjs";
import { ListingsTable } from "@/components/portfolio/listings-table";

export default function PortfolioListingsPage() {
  const { user } = useUser();
  const address = user?.publicMetadata?.publicKey as string | undefined;
  return <ListingsTable address={address!} />;
}
