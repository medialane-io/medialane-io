import type { Metadata } from "next";
import { ClaimPageClient } from "./claim-page-client";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Claims & Drops — Medialane",
  description:
    "Claim your Genesis NFT, import your Starknet collection, or reserve your creator username on Medialane.",
  alternates: canonical("/claim"),
  openGraph: {
    title: "Claims & Drops — Medialane",
    description:
      "Claim your Genesis NFT, import your Starknet collection, or reserve your creator username on Medialane.",
    type: "website",
    url: "/claim",
  },
};

export default function ClaimPage() {
  return <ClaimPageClient />;
}
