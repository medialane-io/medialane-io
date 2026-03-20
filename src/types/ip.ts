// Local const for z.enum() — [string, ...string[]] tuple required by Zod.
export const IP_TYPES = [
  "Audio",
  "Art",
  "Documents",
  "NFT",
  "Video",
  "Photography",
  "Patents",
  "Posts",
  "Publications",
  "RWA",
  "Software",
  "Custom",
] as const;

export type IPType = (typeof IP_TYPES)[number];

export interface LicenseType {
  value: string;
  label: string;
  description: string;
  commercialUse: "Yes" | "No";
  derivatives: "Allowed" | "Not Allowed" | "Share-Alike";
  attribution: "Required" | "Not Required";
}

export const LICENSE_TYPES: LicenseType[] = [
  {
    value: "All Rights Reserved",
    label: "All Rights Reserved",
    description: "No permissions granted beyond viewing.",
    commercialUse: "No",
    derivatives: "Not Allowed",
    attribution: "Required",
  },
  {
    value: "CC0",
    label: "CC0 — Public Domain",
    description: "No rights reserved. Anyone can use for any purpose.",
    commercialUse: "Yes",
    derivatives: "Allowed",
    attribution: "Not Required",
  },
  {
    value: "CC BY",
    label: "CC BY — Attribution",
    description: "Free to use commercially with attribution.",
    commercialUse: "Yes",
    derivatives: "Allowed",
    attribution: "Required",
  },
  {
    value: "CC BY-SA",
    label: "CC BY-SA — Attribution ShareAlike",
    description: "Free to use with attribution; derivatives must use the same license.",
    commercialUse: "Yes",
    derivatives: "Share-Alike",
    attribution: "Required",
  },
  {
    value: "CC BY-NC",
    label: "CC BY-NC — Attribution NonCommercial",
    description: "Free for non-commercial use with attribution.",
    commercialUse: "No",
    derivatives: "Allowed",
    attribution: "Required",
  },
  {
    value: "CC BY-ND",
    label: "CC BY-ND — Attribution NoDerivatives",
    description: "Free to share with attribution; no modifications allowed.",
    commercialUse: "Yes",
    derivatives: "Not Allowed",
    attribution: "Required",
  },
  {
    value: "CC BY-NC-SA",
    label: "CC BY-NC-SA — Attribution NonCommercial ShareAlike",
    description: "Non-commercial use with attribution; derivatives must use same license.",
    commercialUse: "No",
    derivatives: "Share-Alike",
    attribution: "Required",
  },
  {
    value: "CC BY-NC-ND",
    label: "CC BY-NC-ND — Attribution NonCommercial NoDerivatives",
    description: "Non-commercial sharing only; no modifications allowed.",
    commercialUse: "No",
    derivatives: "Not Allowed",
    attribution: "Required",
  },
  {
    value: "MIT",
    label: "MIT License",
    description: "Open source software license permitting reuse with attribution.",
    commercialUse: "Yes",
    derivatives: "Allowed",
    attribution: "Required",
  },
  {
    value: "Apache 2.0",
    label: "Apache 2.0",
    description: "Open source license with patent protection.",
    commercialUse: "Yes",
    derivatives: "Allowed",
    attribution: "Required",
  },
  {
    value: "Custom",
    label: "Custom License",
    description: "Define your own terms in the description.",
    commercialUse: "No",
    derivatives: "Not Allowed",
    attribution: "Required",
  },
];

export const GEOGRAPHIC_SCOPES = [
  "Worldwide",
  "North America",
  "Europe",
  "Asia-Pacific",
  "Latin America",
  "Middle East & Africa",
] as const;

export const AI_POLICIES = ["Allowed", "Not Allowed", "Training Only"] as const;

export const DERIVATIVES_OPTIONS = ["Allowed", "Not Allowed", "Share-Alike"] as const;

/** Trait types that represent IP licensing metadata in the attributes array. */
export const LICENSE_TRAIT_TYPES = new Set([
  "License",
  "Commercial Use",
  "Derivatives",
  "Attribution",
  "Territory",
  "AI Policy",
  "Royalty",
  "Standard",
  "Registration",
]);
