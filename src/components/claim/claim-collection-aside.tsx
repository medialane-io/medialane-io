import { LayoutGrid, UserCircle, Link2, ShieldCheck, type LucideIcon } from "lucide-react";

const BENEFITS: { icon: LucideIcon; title: string; desc: string; chip: string }[] = [
  { icon: LayoutGrid, title: "Branded collection page", desc: "Custom name, cover, banner and links — all editable.", chip: "from-brand-blue to-brand-purple" },
  { icon: UserCircle, title: "Linked to your profile", desc: "It shows up on your public creator profile.", chip: "from-brand-purple to-brand-rose" },
  { icon: Link2, title: "One shareable URL", desc: "Share your collection in a single, clean link.", chip: "from-brand-blue to-brand-purple" },
];

const STEPS = [
  "Paste your collection's contract address",
  "We verify you own it on-chain",
  "It goes live on your profile",
];

/** Context rail for /claim/collection — value, how-it-works, and a
 *  non-custodial trust note. Pure presentation, visible even when gated.
 *  Brand-tinted surfaces per the design system (blue→purple primary). */
export function ClaimCollectionAside() {
  return (
    <>
      {/* What you get — purple surface */}
      <div className="rounded-2xl border border-brand-purple/25 bg-gradient-to-br from-brand-purple/[0.10] to-transparent p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-purple">What you get</p>
        <ul className="space-y-3.5">
          {BENEFITS.map(({ icon: Icon, title, desc, chip }) => (
            <li key={title} className="flex items-start gap-3">
              <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${chip} flex items-center justify-center shrink-0 shadow-sm shadow-brand-purple/20`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* How it works — blue surface */}
      <div className="rounded-2xl border border-brand-blue/25 bg-gradient-to-br from-brand-blue/[0.10] to-transparent p-5 space-y-3.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue">How it works</p>
        <ol className="space-y-3">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              <span className="h-6 w-6 rounded-full bg-brand-blue/15 text-brand-blue text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-muted-foreground">{label}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Non-custodial trust note — emerald is the system's trust-only hue */}
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-4 flex items-start gap-3">
        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Non-custodial.</span> Claiming only links your
          collection to your profile — Medialane never moves or holds your assets. They stay in your contract.
        </p>
      </div>
    </>
  );
}
