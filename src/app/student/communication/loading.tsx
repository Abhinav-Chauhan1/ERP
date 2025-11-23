import { SkeletonList } from "@/components/shared/loading/skeleton-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentCommunicationLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-full max-w-md" />

      {/* Messages List */}
      <SkeletonList items={8} showHeader={false} />
    </div>
  );
}
