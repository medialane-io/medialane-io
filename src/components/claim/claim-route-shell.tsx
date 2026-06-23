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
  /** Optional element shown on the right of the gradient header (e.g. a URL pill). */
  headerAccessory?: React.ReactNode;
  /** Bento side panels — each sets its own `lg:col-span-*`. Enables the grid layout. */
  aside?: React.ReactNode;
  children: React.ReactNode;
}

/** Claim route layout: back button + a gradient feature header, then either a
 *  single-column gated form (simple routes) or an 8/4 Bento 2 grid where the
 *  form is the dominant compartment and `aside` supplies the side panels. */
export function ClaimRouteShell({ icon, title, subtitle, redirectUrl, headerAccessory, aside, children }: ClaimRouteShellProps) {
  const header = (
    <div className={cn("relative overflow-hidden rounded-2xl p-6 sm:p-7 bg-gradient-to-br from-brand-blue via-brand-purple to-brand-rose", aside && "lg:col-span-12")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
              {icon}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
          </div>
          <p className="text-sm text-white/80 max-w-xl">{subtitle}</p>
        </div>
        {headerAccessory}
      </div>
    </div>
  );

  const form = (
    <div className={cn(aside && "lg:col-span-8 rounded-2xl border border-border bg-gradient-to-br from-brand-blue/[0.06] to-brand-purple/[0.02] p-5 sm:p-6 lg:flex lg:flex-col lg:justify-center")}>
      <ClaimGate redirectUrl={redirectUrl}>{children}</ClaimGate>
    </div>
  );

  return (
    <div className={cn("container mx-auto px-4 sm:px-6 py-10 space-y-6 pb-20", aside ? "max-w-5xl" : "max-w-3xl")}>
      <ClaimBackButton />
      {aside ? (
        <div className="grid gap-4 lg:grid-cols-12">
          {header}
          {form}
          <div className="lg:col-span-4 space-y-4">{aside}</div>
        </div>
      ) : (
        <div className="space-y-6">
          {header}
          {form}
        </div>
      )}
    </div>
  );
}
