import type { Metadata } from "next";
import { ClaimPageClient } from "./claim-page-client";

export const metadata: Metadata = {
  title: "Claims & Drops — Medialane",
  description:
    "Claim your Genesis NFT, import your Starknet collection, or reserve your creator username on Medialane.",
  openGraph: {
    title: "Claims & Drops — Medialane",
    description:
      "Claim your Genesis NFT, import your Starknet collection, or reserve your creator username on Medialane.",
    type: "website",
  },
};

export default function ClaimPage() {
  return <ClaimPageClient />;
}
