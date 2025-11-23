import { SkeletonStats } from "@/components/shared/loading/skeleton-stats";
import { SkeletonTable } from "@/components/shared/loading/skeleton-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAdmissionsLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Stats Cards */}
      <SkeletonStats count={4} />

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Applications Table */}
      <SkeletonTable rows={10} columns={7} showHeader={false} />
    </div>
  );
}
