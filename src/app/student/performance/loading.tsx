import { SkeletonStats } from "@/components/shared/loading/skeleton-stats";
import { SkeletonCard } from "@/components/shared/loading/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentPerformanceLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <Skeleton className="h-8 w-48" />

      {/* Stats */}
      <SkeletonStats count={4} />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard contentLines={8} />
        <SkeletonCard contentLines={8} />
      </div>
    </div>
  );
}
