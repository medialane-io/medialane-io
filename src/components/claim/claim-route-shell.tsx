import { ClaimGate } from "@/components/claim/claim-gate";
import { ClaimBackButton } from "@/components/claim/claim-back-button";
import { cn } from "@/lib/utils";

interface ClaimRouteShellProps {
  /** Rendered icon element, e.g. <FolderInput className="h-4 w-4 text-white" />. */
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  /** Route to return to after wallet onboarding (passed to ClaimGate). */
  redirectUrl?: string;
  /** Wrap the form in ClaimGate (sign-in/wallet overlay). Default true. Pages
   *  already protected by middleware (e.g. /create/*) pass false. */
  gated?: boolean;
  /** Optional element shown under the header subtitle (e.g. a URL pill). */
  headerAccessory?: React.ReactNode;
  /** Right-rail panels. Enables the asymmetric grid layout. */
  aside?: React.ReactNode;
  children: React.ReactNode;
}

/** Claim route layout. Header and form share the same dark surface; the header
 *  carries a static brand gradient border, and the form carries the ANIMATED
 *  full-spectrum border (reused from the asset page / Buy button) so the action
 *  is the visual focus among the vivid side panels. */
export function ClaimRouteShell({ icon, title, subtitle, redirectUrl, gated = true, headerAccessory, aside, children }: ClaimRouteShellProps) {
  const gatedChildren = gated ? <ClaimGate redirectUrl={redirectUrl ?? "/claim"}>{children}</ClaimGate> : children;
  const header = (
    <div className="rounded-2xl p-[1.5px] bg-gradient-to-br from-brand-blue via-brand-purple to-brand-rose">
      <div className="rounded-[15px] bg-card p-6 sm:p-7">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            {icon}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">{title}</h1>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">{subtitle}</p>
        {headerAccessory && <div className="mt-4">{headerAccessory}</div>}
      </div>
    </div>
  );

  // The form is the focus: animated gradient border around the dark card.
  const form = aside ? (
    <div className="btn-border-animated p-[1.5px] rounded-2xl">
      <div className="rounded-[15px] bg-card p-5 sm:p-6">{gatedChildren}</div>
    </div>
  ) : (
    gatedChildren
  );

  return (
    <div className={cn("container mx-auto px-4 sm:px-6 py-10 space-y-6 pb-20", aside ? "max-w-5xl" : "max-w-3xl")}>
      <ClaimBackButton />
      {aside ? (
        <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
          <div className="space-y-4 lg:col-span-8">
            {header}
            {form}
          </div>
          <div className="space-y-4 lg:col-span-4">{aside}</div>
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
