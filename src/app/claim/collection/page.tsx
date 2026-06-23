import type { Metadata } from "next";
import { FolderInput } from "lucide-react";
import { canonical } from "@/lib/seo";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { ClaimCollectionPanel } from "@/components/claim/claim-collection-panel";

export const metadata: Metadata = {
  title: "Claim a Collection — Medialane",
  description:
    "Already deployed an ERC-721 collection on Starknet? Claim it to link it to your Medialane profile and give it a branded collection page.",
  alternates: canonical("/claim/collection"),
  openGraph: {
    title: "Claim a Collection — Medialane",
    description:
      "Import an existing Starknet ERC-721 collection into your Medialane profile.",
    type: "website",
    url: "/claim/collection",
  },
};

export default function ClaimCollectionPage() {
  return (
    <ClaimRouteShell
      icon={<FolderInput className="h-4 w-4 text-white" />}
      title="Claim a Collection"
      subtitle="Import an existing Starknet ERC-721 collection into your Medialane profile."
      redirectUrl="/claim/collection"
    >
      <ClaimCollectionPanel />
    </ClaimRouteShell>
  );
}
