import { cn } from "@/lib/utils";

interface ServiceHeaderProps {
  /** Rendered icon element, e.g. <Coins className="h-4 w-4 text-white" />. */
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  /** Optional element shown under the subtitle (e.g. a URL pill). */
  headerAccessory?: React.ReactNode;
  className?: string;
}

/** Shared launchpad/claim header: dark card on a static brand gradient border,
 *  solid primary icon chip. Used standalone (e.g. coin page) or via ClaimRouteShell. */
export function ServiceHeader({ icon, title, subtitle, headerAccessory, className }: ServiceHeaderProps) {
  return (
    <div className={cn("rounded-2xl p-[1.5px] bg-gradient-to-br from-brand-blue via-brand-purple to-brand-rose", className)}>
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
}
