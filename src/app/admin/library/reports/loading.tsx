import { SkeletonCard } from "@/components/shared/loading/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LibraryReportsLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-40" />
        ))}
      </div>

      {/* Report Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard contentLines={8} />
        <SkeletonCard contentLines={8} />
      </div>

      {/* Chart */}
      <Skeleton className="h-80 w-full rounded-lg" />
    </div>
  );
}
