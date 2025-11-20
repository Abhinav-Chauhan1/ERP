import { SkeletonTable } from "@/components/shared/loading/skeleton-table";
import { SkeletonStats } from "@/components/shared/loading/skeleton-stats";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherAttendanceLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats */}
      <SkeletonStats count={3} />

      {/* Table */}
      <SkeletonTable rows={8} columns={6} />
    </div>
  );
}
