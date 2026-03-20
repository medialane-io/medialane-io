import { Skeleton } from "@/components/ui/skeleton";

export default function CreatorLoading() {
  return (
    <div className="pb-20 min-h-screen">
      {/* Banner */}
      <Skeleton className="w-full h-48 sm:h-64 rounded-none" />

      <div className="px-6">
        {/* Identity row */}
        <div className="-mt-14 sm:-mt-16 relative z-10">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3 pb-6">
            <Skeleton className="h-[88px] w-[88px] rounded-full shrink-0 ring-[3px] ring-background" />
            <div className="flex-1 min-w-0 pb-1 space-y-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg pb-1" />
          </div>
        </div>

        {/* Tab bar */}
        <div className="border-b border-border flex gap-1 pb-0 mb-0">
          {[72, 80, 104, 76].map((w, i) => (
            <Skeleton key={i} className="h-10 rounded-none" style={{ width: w }} />
          ))}
        </div>

        {/* Asset grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
