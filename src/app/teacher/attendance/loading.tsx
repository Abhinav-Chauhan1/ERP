import { SkeletonStats } from "@/components/shared/loading/skeleton-stats";
import { SkeletonTable } from "@/components/shared/loading/skeleton-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherAttendanceLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Class Selector */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Stats Cards */}
      <SkeletonStats count={4} />

      {/* Attendance Table */}
      <SkeletonTable rows={15} columns={4} showHeader={true} showPagination={false} />

      {/* Submit Button */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
}
