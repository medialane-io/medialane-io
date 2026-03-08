/**
 * Typed Tailwind class constants for Medialane brand colors.
 * Keeping these as string literals ensures Tailwind JIT picks them up
 * via the `src/**` content pattern in tailwind.config.ts.
 */
export const BRAND = {
  purple: {
    text:    "text-brand-purple",
    bg:      "bg-brand-purple/10",
    bgSolid: "bg-brand-purple/15",
    from:    "from-brand-purple/20",
    to:      "to-brand-purple/20",
  },
  blue: {
    text:    "text-brand-blue",
    bg:      "bg-brand-blue/10",
    bgSolid: "bg-brand-blue/15",
    from:    "from-brand-blue/20",
    to:      "to-brand-blue/20",
  },
  rose: {
    text:    "text-brand-rose",
    bg:      "bg-brand-rose/10",
    bgSolid: "bg-brand-rose/15",
    from:    "from-brand-rose/20",
    to:      "to-brand-rose/20",
  },
  orange: {
    text:    "text-brand-orange",
    bg:      "bg-brand-orange/10",
    bgSolid: "bg-brand-orange/15",
    from:    "from-brand-orange/20",
    to:      "to-brand-orange/20",
  },
  navy: {
    text:    "text-brand-navy",
    bg:      "bg-brand-navy/10",
    from:    "from-brand-navy/10",
    to:      "to-brand-navy/10",
  },
} as const;
