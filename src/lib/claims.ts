import { Gift } from "lucide-react";
import { COLLECTION_NAME_CLAIM, type ServiceDefinition, type ServiceOverrides } from "@medialane/ui";

export const SHARED_CLAIM_KEYS = ["claim-username", "claim-collection", "claim-memecoin"] as const;

export const AIRDROP_CLAIM: ServiceDefinition = {
  key: "claim-airdrop",
  cta: "Claim",
  blurb: "Join the Creator's Airdrop and claim a Genesis NFT.",
  title: "Claim Airdrop",
  subtitle: "Join the Creator's Airdrop",
  description: "Join the Creator's Airdrop, earn XP while creating, and claim a Genesis NFT.",
  features: ["Free to join", "Earn XP while creating", "Claim a Genesis NFT"],
  icon: Gift,
  status: "live",
  group: "claims",
};

export function claimDefinitions(all: readonly ServiceDefinition[]): ServiceDefinition[] {
  const shared = SHARED_CLAIM_KEYS.map((key) => all.find((d) => d.key === key)).filter((d): d is ServiceDefinition => d !== undefined)
    .map((d) => ({ ...d, group: "claims" as const }));
  return [AIRDROP_CLAIM, ...shared.slice(0, 2), COLLECTION_NAME_CLAIM, ...shared.slice(2)];
}

export function claimOverrides(base: ServiceOverrides): ServiceOverrides {
  return { ...base, [AIRDROP_CLAIM.key]: { href: "/airdrop" }, "claim-memecoin": { href: "/claim/memecoin" } };
}
