import { LayoutGrid, UserCircle, Link2, ShieldCheck, type LucideIcon } from "lucide-react";

const BENEFITS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: LayoutGrid, title: "Branded collection page", desc: "Custom name, cover, banner and links — all editable." },
  { icon: UserCircle, title: "Linked to your profile", desc: "It shows up on your public creator profile." },
  { icon: Link2, title: "One shareable URL", desc: "Share your collection in a single, clean link." },
];

const STEPS = [
  "Paste your collection's contract address",
  "We verify you own it on-chain",
  "It goes live on your profile",
];

const LABEL = "text-xs font-semibold uppercase tracking-wider text-white/70";
const CHIP = "h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0";

/** Right-rail panels for /claim/collection — vivid, full-gradient "good vibes"
 *  cards flowing as a spectrum (blue→purple→rose→orange). White text, frosted
 *  chips. Stacked by the shell inside a single col-span-4 rail. */
export function ClaimCollectionAside() {
  return (
    <>
      {/* What's included — deep blue → indigo */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <p className={LABEL}>What&apos;s included</p>
        <ul className="mt-4 space-y-4">
          {BENEFITS.map(({ icon: Icon, title, desc }) => (
            <li key={title} className="flex items-start gap-3">
              <div className={CHIP}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-white/80 leading-relaxed mt-0.5">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* How it works — deep violet → fuchsia */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white">
        <p className={LABEL}>How it works</p>
        <ol className="mt-4 space-y-3">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              <span className={`${CHIP} text-sm font-bold`}>{i + 1}</span>
              <span className="text-sm text-white/90">{label}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Non-custodial — deep rose → orange (trust glyph kept) */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-rose-600 to-orange-600 text-white flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-white shrink-0 mt-0.5" />
        <p className="text-sm text-white/90 leading-relaxed">
          <span className="font-semibold">Non-custodial.</span> Claiming only links your collection to your
          profile — Medialane never moves or holds your assets. They stay in your contract.
        </p>
      </div>
    </>
  );
}
