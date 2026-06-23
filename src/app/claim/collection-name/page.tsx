import type { Metadata } from "next";
import { Link2 } from "lucide-react";
import { canonical } from "@/lib/seo";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { CollectionNameClaim } from "@/components/claim/collection-name-claim";

export const metadata: Metadata = {
  title: "Claim a Collection Name — Medialane",
  description:
    "Give your collection a clean, memorable web address — medialane.io/collection/your-name — instead of a long contract address.",
  alternates: canonical("/claim/collection-name"),
  openGraph: {
    title: "Claim a Collection Name — Medialane",
    description: "Reserve a clean, shareable URL for your collection page.",
    type: "website",
    url: "/claim/collection-name",
  },
};

export default function ClaimCollectionNamePage() {
  return (
    <ClaimRouteShell
      icon={<Link2 className="h-4 w-4 text-white" />}
      title="Claim a Collection Name"
      subtitle="Pick a collection to give it a clean, memorable URL — medialane.io/collection/your-name."
      redirectUrl="/claim/collection-name"
    >
      <CollectionNameClaim />
    </ClaimRouteShell>
  );
}
