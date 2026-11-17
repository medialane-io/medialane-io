import type { Metadata } from "next";
import { Link2 } from "lucide-react";
import { canonical, buildSocialMetadata } from "@/lib/seo";
import { ClaimRouteShell } from "@medialane/ui";
import { ClaimGate } from "@/components/claim/claim-gate";
import { CollectionNameClaim } from "@medialane/ui";
import { PageAside } from "@/components/claim/page-aside";

const title = "Claim a Collection Name";
const description =
  "Give your collection a clean, memorable web address — medialane.io/collection/your-name — instead of a long contract address.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/claim/collection-name"),
  ...buildSocialMetadata({ title, description }),
};

export default function ClaimCollectionNamePage() {
  return (
    <ClaimRouteShell
      icon={<Link2 className="h-4 w-4 text-white" />}
      title="Claim a Collection Name"
      subtitle="Pick a collection to give it a clean, memorable URL — medialane.io/collection/your-name."
      aside={<PageAside kind="claimCollectionName" />}
    >
      <ClaimGate>
        <CollectionNameClaim />
      </ClaimGate>
    </ClaimRouteShell>
  );
}
