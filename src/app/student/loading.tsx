import { SkeletonStats } from "@/components/shared/loading/skeleton-stats";
import { SkeletonCard } from "@/components/shared/loading/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDashboardLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Cards */}
      <SkeletonStats count={4} />

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard contentLines={5} />
        <SkeletonCard contentLines={5} />
      </div>
    </div>
  );
}
