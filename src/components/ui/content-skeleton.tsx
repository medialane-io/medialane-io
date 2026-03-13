import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ContentSkeleton — branded skeleton with purple shimmer.
 * Thin wrapper around shadcn Skeleton.
 * Usage: <ContentSkeleton className="h-48 w-full rounded-xl" />
 */
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
