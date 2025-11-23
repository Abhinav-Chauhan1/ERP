import { SkeletonCard } from "@/components/shared/loading/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentAcademicsLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28" />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} contentLines={4} showFooter />
        ))}
      </div>
    </div>
  );
}
