import { SkeletonFormTabs } from "@/components/shared/loading/skeleton-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentSettingsLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <Skeleton className="h-8 w-48" />

      {/* Tabs and Form */}
      <SkeletonFormTabs />
    </div>
  );
}
