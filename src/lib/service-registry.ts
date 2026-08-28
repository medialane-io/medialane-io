import { Award, Package, Ticket } from "lucide-react";
import { BRAND } from "@/lib/brand";

export interface ServiceConfig {

  serviceId: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;

  badge: string;

  color: {
    text: string;
    bgSolid: string;
    from: string;
    to: string;
  };
  launchpadHref: string;

  hasDetailAction: boolean;
}

const SERVICE_REGISTRY: Record<string, ServiceConfig> = {
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
  "ip-tickets": {
    serviceId: "ip-tickets",
    name: "IP Tickets",
    description: "Verifiable on-chain tickets",
    icon: Ticket,
    badge: "TICKETS",
    color: {
      text: "text-teal-500",
      bgSolid: "bg-teal-600",
      from: "from-teal-500/10",
      to: "to-cyan-500/10",
    },
    launchpadHref: "/launchpad/tickets",
    hasDetailAction: true,
  },
};

export function getServiceConfig(serviceId: string | null | undefined): ServiceConfig | null {
  if (!serviceId) return null;
  return SERVICE_REGISTRY[serviceId] ?? null;
}
