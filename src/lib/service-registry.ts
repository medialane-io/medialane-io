import { Award, Package } from "lucide-react";
import { BRAND } from "@/lib/brand";

export type CollectionSource =
  | "MEDIALANE_ERC721"
  | "MEDIALANE_ERC1155"
  | "EXTERNAL_ERC721"
  | "EXTERNAL_ERC1155"
  | "MEDIALANE_REGISTRY"
  | "ERC1155_FACTORY"
  | "EXTERNAL"
  | "PARTNERSHIP"
  | "IP_TICKET"
  | "IP_CLUB"
  | "GAME"
  | "POP_PROTOCOL"
  | "COLLECTION_DROP";

export interface ServiceConfig {
  /** Canonical service id (01-core-model §III), e.g. "pop-protocol". */
  serviceId: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Badge text shown on launchpad card and collection detail */
  badge: string;
  /** Color classes from BRAND */
  color: {
    text: string;
    bgSolid: string;
    from: string;
    to: string;
  };
  launchpadHref: string;
  /** Whether to show a claim/mint action on the collection detail page */
  hasDetailAction: boolean;
}

// UI-presentation config keyed by canonical service id (complements the
// SDK behavioral registry getService()). Re-keyed from the legacy source
// enum during the service-model refactor (Phase 2C).
export const SERVICE_REGISTRY: Record<string, ServiceConfig> = {
  "pop-protocol": {
    serviceId: "pop-protocol",
    name: "POP Protocol",
    description: "Soulbound proof-of-participation credential",
    icon: Award,
    badge: "POP",
    color: {
      text: "text-green-500",
      bgSolid: "bg-green-600",
      from: "from-green-500/10",
      to: "to-emerald-500/10",
    },
    launchpadHref: "/launchpad/pop",
    hasDetailAction: true,
  },
  "drop-collection": {
    serviceId: "drop-collection",
    name: "Collection Drop",
    description: "Limited edition timed release",
    icon: Package,
    badge: "DROP",
    color: {
      text: BRAND.orange.text,
      bgSolid: "bg-orange-600",
      from: "from-orange-500/10",
      to: "to-amber-500/10",
    },
    launchpadHref: "/launchpad/drop",
    hasDetailAction: true,
  },
};

/** Look up UI config by canonical service id (collection.service). */
export function getServiceConfig(serviceId: string | null | undefined): ServiceConfig | null {
  if (!serviceId) return null;
  return SERVICE_REGISTRY[serviceId] ?? null;
}
