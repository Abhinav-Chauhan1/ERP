"use client";

/**
 * Skeleton Loader for Sub-Module List
 * Provides loading state while sub-modules are being fetched
 * Requirements: Task 16 - Loading states
 */

import { Skeleton } from "@/components/ui/skeleton";

interface SubModuleListSkeletonProps {
  count?: number;
}

export function SubModuleListSkeleton({ count = 2 }: SubModuleListSkeletonProps) {
  return (
    <div className="space-y-3">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Sub-module items skeleton */}
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <SubModuleItemSkeleton key={index} index={index} />
        ))}
      </div>
    </div>
  );
}

function SubModuleItemSkeleton({ index }: { index: number }) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-md bg-accent/50">
      <div className="flex items-center gap-2 flex-1">
        {/* Drag handle skeleton */}
        <Skeleton className="h-4 w-4 rounded" />

        {/* Number skeleton */}
        <Skeleton className="h-4 w-4" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full max-w-xs" />
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-1">
        <Skeleton className="h-7 w-7 rounded" />
        <Skeleton className="h-7 w-7 rounded" />
      </div>
    </div>
  );
}

export function SubModuleListEmptySkeleton() {
  return (
    <div className="text-center py-4 border rounded-md bg-accent/30">
      <Skeleton className="h-4 w-48 mx-auto" />
    </div>
  );
}
