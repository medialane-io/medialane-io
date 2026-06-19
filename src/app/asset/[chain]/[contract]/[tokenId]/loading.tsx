import { PageContainer } from "@medialane/ui";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssetLoading() {
  return (
    <PageContainer className="pt-20 pb-8 space-y-8">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-48" />

      <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-10 gap-6 items-start">
        {/* Image */}
        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />

        {/* Right column — mirrors the live layout */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          <Skeleton className="h-9 w-28" />

          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-2xl" />
            ))}
          </div>

          <div className="pt-5 border-t border-border/40 space-y-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="space-y-2.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex flex-wrap gap-2 pt-0.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-24 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
