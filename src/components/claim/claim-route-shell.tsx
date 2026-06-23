import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClaimGate } from "@/components/claim/claim-gate";

interface ClaimRouteShellProps {
  /** Rendered icon element, e.g. <FolderInput className="h-4 w-4 text-white" />. */
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  /** Route to return to after wallet onboarding (passed to ClaimGate). */
  redirectUrl: string;
  children: React.ReactNode;
}

/** Focused single-claim page layout: back link, header, then the gated panel.
 *  Keeps the per-claim route files tiny and visually consistent. */
export function ClaimRouteShell({ icon, title, subtitle, redirectUrl, children }: ClaimRouteShellProps) {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-12 max-w-3xl space-y-8 pb-20">
      <Link
        href="/launchpad"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Launchpad
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
            {icon}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">{title}</h1>
        </div>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      <ClaimGate redirectUrl={redirectUrl}>{children}</ClaimGate>
    </div>
  );
}
