import { SkeletonCard } from "@/components/shared/loading/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentAcademicsLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <Skeleton className="h-8 w-48" />

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard contentLines={4} showFooter />
        <SkeletonCard contentLines={4} showFooter />
        <SkeletonCard contentLines={4} showFooter />
        <SkeletonCard contentLines={4} showFooter />
      </div>
    </div>
  );
}
