import { ServiceFormShell } from "@medialane/ui";
import { ClaimBackButton } from "@/components/claim/claim-back-button";

interface ClaimRouteShellProps {

  icon: React.ReactNode;
  title: string;
  subtitle: string;

  headerAccessory?: React.ReactNode;

  aside?: React.ReactNode;
  children: React.ReactNode;
}

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
