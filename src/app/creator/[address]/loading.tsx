import { Skeleton } from "@/components/ui/skeleton";

export default function CreatorLoading() {
  return (
    <div className="pb-20 min-h-screen">
      {/* Banner */}
      <Skeleton className="w-full h-52 sm:h-72 rounded-none" />

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Identity row */}
        <div className="-mt-16 relative z-10 flex flex-col sm:flex-row sm:items-end gap-5 pb-8">
          <Skeleton className="h-[88px] w-[88px] rounded-full shrink-0 ring-[3px] ring-background" />
          <div className="flex-1 min-w-0 sm:pb-1 space-y-2">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          {/* Desktop stats */}
          <div className="hidden sm:flex items-end gap-8 pb-1 shrink-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-right space-y-1.5">
                <Skeleton className="h-8 w-10 ml-auto" />
                <Skeleton className="h-2.5 w-14" />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile stats */}
        <div className="sm:hidden grid grid-cols-3 gap-3 mb-8 border-t border-border/50 pt-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>

        {/* Tab bar */}
        <div className="border-b border-border/60 mb-8 flex gap-1 pb-0">
          {[80, 72, 80].map((w, i) => (
            <Skeleton key={i} className="h-10 rounded-t-lg" style={{ width: w }} />
          ))}
        </div>

        {/* Asset grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border overflow-hidden">
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
