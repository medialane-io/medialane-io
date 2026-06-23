import { LayoutGrid, UserCircle, Link2, ShieldCheck, Globe, type LucideIcon } from "lucide-react";

const BENEFITS: { icon: LucideIcon; color: string; title: string; desc: string }[] = [
  { icon: LayoutGrid, color: "text-brand-blue", title: "Branded collection page", desc: "Custom name, cover, banner and links — all editable." },
  { icon: UserCircle, color: "text-brand-rose", title: "Linked to your profile", desc: "It shows up on your public creator profile." },
  { icon: Link2, color: "text-brand-purple", title: "One shareable URL", desc: "Share your collection in a single, clean link." },
];

const STEPS = [
  "Paste your collection's contract address",
  "We verify you own it on-chain",
  "It goes live on your profile",
];

const LABEL = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";
const CARD = "rounded-2xl border border-border bg-card p-5";
const CHIP = "h-8 w-8 rounded-lg bg-foreground flex items-center justify-center shrink-0";

/** Context rail for /claim/collection — a vivid gradient anchor, then clean,
 *  consistent cards for value / steps / trust. Solid icon chips (no gradients),
 *  one type scale, no colored text. */
export function ClaimCollectionAside() {
  return (
    <>
      {/* Vivid gradient bento — the creative anchor (design-system style) */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-brand-blue via-brand-purple to-brand-rose">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Your collection page</p>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 backdrop-blur-sm">
          <Globe className="h-4 w-4 text-white shrink-0" />
          <span className="font-mono text-sm text-white truncate">medialane.io/collections/your-collection</span>
        </div>
      </div>

      {/* What you get */}
      <div className={`${CARD} space-y-4`}>
        <p className={LABEL}>What&apos;s included</p>
        <ul className="space-y-4">
          {BENEFITS.map(({ icon: Icon, color, title, desc }) => (
            <li key={title} className="flex items-start gap-3">
              <div className={CHIP}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* How it works */}
      <div className={`${CARD} space-y-4`}>
        <p className={LABEL}>How it works</p>
        <ol className="space-y-3">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              <span className={`${CHIP} text-background text-sm font-bold`}>{i + 1}</span>
              <span className="text-sm text-muted-foreground">{label}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Non-custodial — emerald glyph is the system's trust hue */}
      <div className={`${CARD} flex items-start gap-3`}>
        <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Non-custodial.</span> Claiming only links your
          collection to your profile — Medialane never moves or holds your assets. They stay in your contract.
        </p>
      </div>
    </>
  );
}
