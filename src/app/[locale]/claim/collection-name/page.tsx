import { Link2 } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";
import { ClaimRouteShell } from "@medialane/ui";
import { ClaimGate } from "@/components/claim/claim-gate";
import { CollectionNameClaim } from "@medialane/ui";
import { PageAside } from "@/components/claim/page-aside";

const title = msg("Claim a collection name");
const description = msg("Give your collection a clean, memorable web address — medialane.io/collection/your-name — instead of a long contract address.");

export const generateMetadata = pageMetadata({
  path: "/claim/collection-name",
  title,
  description,
});

export default function ClaimCollectionNamePage() {
  return (
    <ClaimRouteShell
      icon={<Link2 className="h-4 w-4 text-white" />}
      title={msg("Claim a collection name")}
      subtitle={msg("Pick a collection to give it a clean, memorable URL — medialane.io/collection/your-name.")}
      aside={<PageAside kind="claimCollectionName" />}
    >
      <ClaimGate>
        <CollectionNameClaim />
      </ClaimGate>
    </ClaimRouteShell>
  );
}
