import { ClaimGate } from "@/components/claim/claim-gate";
import { ClaimBackButton } from "@/components/claim/claim-back-button";
import { cn } from "@/lib/utils";

interface ClaimRouteShellProps {
  /** Rendered icon element, e.g. <FolderInput className="h-4 w-4 text-white" />. */
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  /** Route to return to after wallet onboarding (passed to ClaimGate). */
  redirectUrl: string;
  /** Optional context rail shown beside the claim panel (value, steps, trust).
   *  Visible even when the panel is gated, so signed-out visitors see the value. */
  aside?: React.ReactNode;
  children: React.ReactNode;
}

/** Focused single-claim page layout: back button, header, then the gated panel.
 *  With `aside`, lays out two top-aligned columns on desktop (panel + context rail). */
export function ClaimRouteShell({ icon, title, subtitle, redirectUrl, aside, children }: ClaimRouteShellProps) {
  const header = (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-xl bg-foreground flex items-center justify-center">
          {icon}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">{title}</h1>
      </div>
      <p className="text-muted-foreground max-w-xl">{subtitle}</p>
    </div>
  );

  const panel = (
    <div className="space-y-8">
      {header}
      <ClaimGate redirectUrl={redirectUrl}>{children}</ClaimGate>
    </div>
  );

  return (
    <div
      className={cn(
        "relative container mx-auto px-4 sm:px-6 py-12 space-y-8 pb-20",
        aside ? "max-w-5xl" : "max-w-3xl",
      )}
    >
      {/* Soft aurora glow behind the header — §III glow surfaces, CSS-only */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-72 overflow-hidden">
        <div className="absolute left-[20%] top-0 h-56 w-56 rounded-full bg-brand-purple/20 blur-3xl" />
        <div className="absolute left-[45%] top-8 h-48 w-48 rounded-full bg-brand-blue/20 blur-3xl" />
      </div>

      <ClaimBackButton />

      {aside ? (
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          {panel}
          <aside className="space-y-4">{aside}</aside>
        </div>
      ) : (
        panel
      )}
    </div>
  );
}
