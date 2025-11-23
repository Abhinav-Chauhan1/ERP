import { SkeletonCard } from "@/components/shared/loading/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ParentChildrenLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Children Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} contentLines={5} showFooter />
        ))}
      </div>
    </div>
  );
}
