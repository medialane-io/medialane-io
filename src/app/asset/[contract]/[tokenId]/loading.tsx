import { Skeleton } from "@/components/ui/skeleton";

export default function AssetLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-48" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <Skeleton className="aspect-square w-full rounded-2xl" />

        {/* Details */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
