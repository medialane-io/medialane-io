import { ServiceFormShell } from "@medialane/ui";
import { ClaimBackButton } from "@/components/claim/claim-back-button";

interface ClaimRouteShellProps {
  /** Rendered icon element, e.g. <FolderInput className="h-4 w-4 text-white" />. */
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  /** Optional element shown under the header subtitle (e.g. a URL pill). */
  headerAccessory?: React.ReactNode;
  /** Right-rail panels. Enables the asymmetric grid layout. */
  aside?: React.ReactNode;
  children: React.ReactNode;
}

/** io's claim/create route shell — injects io's back button into the shared,
 *  presentation-only ServiceFormShell (@medialane/ui). Auth is handled by
 *  middleware (sign-in + onboarding redirects), not in-page. */
export function ClaimRouteShell({ icon, title, subtitle, headerAccessory, aside, children }: ClaimRouteShellProps) {
  return (
    <ServiceFormShell
      icon={icon}
      title={title}
      subtitle={subtitle}
      headerAccessory={headerAccessory}
      aside={aside}
      backSlot={<ClaimBackButton />}
    >
      {children}
    </ServiceFormShell>
  );
}
