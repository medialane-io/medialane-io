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
  /** Optional element shown under the header subtitle (e.g. a URL pill). */
  headerAccessory?: React.ReactNode;
  /** Right-rail panels. Enables the asymmetric grid layout. */
  aside?: React.ReactNode;
  children: React.ReactNode;
}

/** Claim route layout: back button + a gradient header (animated full-spectrum
 *  border, like the asset page / Buy button). With `aside`, the header + form
 *  stack in the left column and the panels fill a top-aligned right rail. */
export function ClaimRouteShell({ icon, title, subtitle, redirectUrl, headerAccessory, aside, children }: ClaimRouteShellProps) {
  const header = (
    <div className="btn-border-animated p-[1.5px] rounded-2xl">
      <div className="rounded-[15px] p-6 sm:p-7 bg-gradient-to-br from-blue-600 via-violet-600 to-rose-500">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
            {icon}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
        </div>
        <p className="mt-1.5 text-sm text-white/80 max-w-xl">{subtitle}</p>
        {headerAccessory && <div className="mt-4">{headerAccessory}</div>}
      </div>
    </div>
  );

  const form = (
    <div className={cn(aside && "rounded-2xl border border-border bg-gradient-to-br from-brand-blue/[0.06] to-brand-purple/[0.02] p-5 sm:p-6")}>
      <ClaimGate redirectUrl={redirectUrl}>{children}</ClaimGate>
    </div>
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
