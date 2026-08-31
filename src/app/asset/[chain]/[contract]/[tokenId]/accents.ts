export interface AssetAccent {
  accentBorderClassName: string;
  accentHeaderStyle: string;
  accentAvatarStyle: string;
  accentLabelClassName: string;
  accentCountStyle: { background: string };
}

export const ASSET_ACCENTS = {
  standard: {
    accentBorderClassName: "border-brand-blue/20",
    accentHeaderStyle: "linear-gradient(135deg, hsl(var(--brand-blue) / 0.10), hsl(var(--brand-purple) / 0.08))",
    accentAvatarStyle: "linear-gradient(135deg, hsl(var(--brand-blue) / 0.3), hsl(var(--brand-purple) / 0.3))",
    accentLabelClassName: "text-brand-blue",
    accentCountStyle: { background: "hsl(var(--brand-blue))" },
  },
  ticket: {
    accentBorderClassName: "border-teal-500/20",
    accentHeaderStyle: "linear-gradient(135deg, hsl(173 80% 40% / 0.10), hsl(var(--brand-blue) / 0.08))",
    accentAvatarStyle: "linear-gradient(135deg, hsl(173 80% 40% / 0.3), hsl(var(--brand-blue) / 0.3))",
    accentLabelClassName: "text-teal-500",
    accentCountStyle: { background: "rgb(13 148 136)" },
  },
  membership: {
    accentBorderClassName: "border-brand-purple/20",
    accentHeaderStyle: "linear-gradient(135deg, hsl(var(--brand-purple) / 0.10), hsl(var(--brand-blue) / 0.08))",
    accentAvatarStyle: "linear-gradient(135deg, hsl(var(--brand-purple) / 0.3), hsl(var(--brand-blue) / 0.3))",
    accentLabelClassName: "text-brand-purple",
    accentCountStyle: { background: "hsl(var(--brand-purple))" },
  },
  edition: {
    accentBorderClassName: "border-brand-purple/20",
    accentHeaderStyle: "linear-gradient(135deg, hsl(var(--brand-purple) / 0.10), hsl(var(--brand-blue) / 0.08))",
    accentAvatarStyle: "linear-gradient(135deg, hsl(266 80% 60% / 0.3), hsl(var(--brand-blue) / 0.3))",
    accentLabelClassName: "text-brand-purple",
    accentCountStyle: { background: "rgb(139 92 246)" },
  },
} as const satisfies Record<string, AssetAccent>;

export type AssetAccentName = keyof typeof ASSET_ACCENTS;
