import { SkeletonStats } from "@/components/shared/loading/skeleton-stats";
import { SkeletonGrid } from "@/components/shared/loading/skeleton-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLibraryLoading() {
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

      {/* Stats Cards */}
      <SkeletonStats count={4} />

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Books Grid */}
      <SkeletonGrid items={6} columns={3} />
    </div>
  );
}
