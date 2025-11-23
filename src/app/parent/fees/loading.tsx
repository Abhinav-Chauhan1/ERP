import { SkeletonStats } from "@/components/shared/loading/skeleton-stats";
import { SkeletonTable } from "@/components/shared/loading/skeleton-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function ParentFeesLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Child Selector */}
      <Skeleton className="h-10 w-64" />

      {/* Stats Cards */}
      <SkeletonStats count={3} />

      {/* Fee Details Table */}
      <SkeletonTable rows={6} columns={5} showHeader={true} showPagination={false} />
    </div>
  );
}
