import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function ContentSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn(
        "bg-[hsl(var(--brand-purple)/0.15)]",
        className
      )}
    />
  );
}
