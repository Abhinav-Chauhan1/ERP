import { SkeletonGrid } from "@/components/shared/loading/skeleton-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentEventsLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Events Grid */}
      <SkeletonGrid items={6} columns={2} />
    </div>
  );
}
