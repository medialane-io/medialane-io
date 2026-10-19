import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionsLoading() {
  return (
    <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="relative rounded-xl border border-border overflow-hidden">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
              <Skeleton className="h-4 w-2/3 bg-muted-foreground/20" />
              <Skeleton className="h-3 w-1/3 bg-muted-foreground/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
