import { ServiceFormShell } from "@medialane/ui";
import { ClaimGate } from "@/components/claim/claim-gate";
import { ClaimBackButton } from "@/components/claim/claim-back-button";

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

/** io's claim/create route shell — injects io's auth gate + back button into
 *  the shared, presentation-only ServiceFormShell (@medialane/ui). */
export function ClaimRouteShell({ icon, title, subtitle, redirectUrl, gated = true, headerAccessory, aside, children }: ClaimRouteShellProps) {
  const gatedChildren = gated ? <ClaimGate redirectUrl={redirectUrl ?? "/claim"}>{children}</ClaimGate> : children;
  return (
    <ServiceFormShell
      icon={icon}
      title={title}
      subtitle={subtitle}
      headerAccessory={headerAccessory}
      aside={aside}
      backSlot={<ClaimBackButton />}
    >
      {gatedChildren}
    </ServiceFormShell>
  );
}
