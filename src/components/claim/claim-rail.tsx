import { ShieldCheck, type LucideIcon } from "lucide-react";

export interface ClaimRailProps {
  /** "What's included" benefits. Omit to hide that panel (e.g. coin page,
   *  where a live preview is the rail's first panel instead). */
  included?: { icon: LucideIcon; title: string; desc: string }[];
  /** "How it works" ordered steps. */
  steps: string[];
  /** Trust/assurance note: bold lead + the rest of the sentence. */
  trustLead: string;
  trust: string;
  /** Trust glyph — defaults to a shield. */
  trustIcon?: LucideIcon;
}

const LABEL = "text-xs font-semibold uppercase tracking-wider text-white/70";
const CHIP = "h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0";

/** Vivid right-rail for claim pages — three "good vibes" gradient panels
 *  (What's included · How it works · trust) flowing as a spectrum. Shared by
 *  every claim route so the friendly content stays consistent. */
export function ClaimRail({ included, steps, trustLead, trust, trustIcon: TrustIcon = ShieldCheck }: ClaimRailProps) {
  return (
    <>
      {/* What's included — deep blue → indigo */}
      {included && included.length > 0 && (
      <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <p className={LABEL}>What&apos;s included</p>
        <ul className="mt-4 space-y-4">
          {included.map(({ icon: Icon, title, desc }) => (
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
      )}

      {/* How it works — deep violet → fuchsia */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white">
        <p className={LABEL}>How it works</p>
        <ol className="mt-4 space-y-3">
          {steps.map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              <span className={`${CHIP} text-sm font-bold`}>{i + 1}</span>
              <span className="text-sm text-white/90">{label}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Trust — deep rose → orange */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-rose-600 to-orange-600 text-white flex items-start gap-3">
        <TrustIcon className="h-5 w-5 text-white shrink-0 mt-0.5" />
        <p className="text-sm text-white/90 leading-relaxed">
          <span className="font-semibold">{trustLead}</span> {trust}
        </p>
      </div>
    </>
  );
}
