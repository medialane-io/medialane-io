import { Skeleton } from "@/components/ui/skeleton";

export default function CreatorLoading() {
  return (
    <div className="space-y-0">
      {/* Banner */}
      <Skeleton className="w-full h-40 sm:h-52 rounded-none" />
      <div className="container mx-auto px-4">
        <div className="flex items-end gap-4 -mt-12 pb-4">
          <Skeleton className="h-24 w-24 rounded-2xl shrink-0 border-4 border-background" />
          <div className="space-y-2 pb-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 space-y-6 pb-12">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
