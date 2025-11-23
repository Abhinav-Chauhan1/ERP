import { SkeletonTable } from "@/components/shared/loading/skeleton-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAuditLogsLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Audit Logs Table */}
      <SkeletonTable rows={15} columns={6} showHeader={false} />
    </div>
  );
}
