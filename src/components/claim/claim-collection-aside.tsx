import { LayoutGrid, UserCircle, Link2, ShieldCheck, type LucideIcon } from "lucide-react";

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
const CHIP = "h-8 w-8 rounded-lg bg-foreground flex items-center justify-center shrink-0";

/** Bento side panels for /claim/collection. Each sets its own `lg:col-span-*`
 *  so it places into the shell's 12-col grid. Soft varied-hue gradient washes,
 *  one type scale, solid icon chips (no gradients). */
export function ClaimCollectionAside() {
  return (
    <>
      {/* What's included — narrow, soft purple→rose */}
      <div className="lg:col-span-4 rounded-2xl border border-border bg-gradient-to-br from-brand-purple/[0.09] to-brand-rose/[0.03] p-5 space-y-4">
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

      {/* How it works — wide, soft rose→orange, steps laid out across */}
      <div className="lg:col-span-8 rounded-2xl border border-border bg-gradient-to-br from-brand-rose/[0.08] to-brand-orange/[0.03] p-5 space-y-4">
        <p className={LABEL}>How it works</p>
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-start gap-3">
              <span className={`${CHIP} text-background text-sm font-bold`}>{i + 1}</span>
              <span className="text-sm text-muted-foreground">{label}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Non-custodial — narrow, soft blue→navy depth, emerald trust glyph */}
      <div className="lg:col-span-4 rounded-2xl border border-border bg-gradient-to-br from-brand-blue/[0.05] to-brand-navy/[0.12] p-5 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Non-custodial.</span> Claiming only links your
          collection to your profile — Medialane never moves or holds your assets. They stay in your contract.
        </p>
      </div>
    </>
  );
}
