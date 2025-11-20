import { SkeletonTable } from "@/components/shared/loading/skeleton-table";
import { SkeletonStats } from "@/components/shared/loading/skeleton-stats";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentAttendanceLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <Skeleton className="h-8 w-48" />

      {/* Stats */}
      <SkeletonStats count={3} />

      {/* Table */}
      <SkeletonTable rows={8} columns={5} showHeader={false} />
    </div>
  );
}
