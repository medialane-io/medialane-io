import { Link2 } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";
import { ClaimRouteShell } from "@medialane/ui";
import { ClaimGate } from "@/components/claim/claim-gate";
import { CollectionNameClaim } from "@medialane/ui";
import { PageAside } from "@medialane/ui/page-aside";

const title = msg("Collection Address");
const description = msg("Give your collection a short, memorable link that's easy to share.");

export const generateMetadata = pageMetadata({
  path: "/claim/collection-name",
  title,
  description,
});

export default function ClaimCollectionNamePage() {
  return (
    <ClaimRouteShell
      icon={<Link2 className="h-4 w-4 text-white" />}
      title={msg("Collection Address")}
      subtitle={msg("Give your collection a short, memorable link that's easy to share.")}
      aside={<PageAside kind="claimCollectionName" />}
    >
      <ClaimGate>
        <CollectionNameClaim />
      </ClaimGate>
    </ClaimRouteShell>
  );
}
