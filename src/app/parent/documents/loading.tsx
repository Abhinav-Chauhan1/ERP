import { SkeletonList } from "@/components/shared/loading/skeleton-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function ParentDocumentsLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Child Selector */}
      <Skeleton className="h-10 w-64" />

      {/* Search and Filters */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Documents List */}
      <SkeletonList items={6} />
    </div>
  );
}
