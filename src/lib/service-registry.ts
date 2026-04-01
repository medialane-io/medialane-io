import { Award, Package } from "lucide-react";
import { BRAND } from "@/lib/brand";

export type CollectionSource =
  | "MEDIALANE_REGISTRY"
  | "EXTERNAL"
  | "PARTNERSHIP"
  | "IP_TICKET"
  | "IP_CLUB"
  | "GAME"
  | "POP_PROTOCOL"
  | "COLLECTION_DROP";

export interface ServiceConfig {
  source: CollectionSource;
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

export const SERVICE_REGISTRY: Partial<Record<CollectionSource, ServiceConfig>> = {
  POP_PROTOCOL: {
    source: "POP_PROTOCOL",
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
  COLLECTION_DROP: {
    source: "COLLECTION_DROP",
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

export function getServiceConfig(source: string | null | undefined): ServiceConfig | null {
  if (!source) return null;
  return SERVICE_REGISTRY[source as CollectionSource] ?? null;
}
