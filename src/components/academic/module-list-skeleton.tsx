"use client";

/**
 * Skeleton Loader for Module List
 * Provides loading state while modules are being fetched
 * Requirements: Task 16 - Loading states
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface ModuleListSkeletonProps {
  count?: number;
}

export function ModuleListSkeleton({ count = 3 }: ModuleListSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Module items skeleton */}
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <ModuleItemSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

function ModuleItemSkeleton() {
  return (
    <Card className="border rounded-md">
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Drag handle skeleton */}
        <Skeleton className="h-5 w-5 rounded" />

        {/* Chapter number skeleton */}
        <Skeleton className="h-8 w-8 rounded-full" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </Card>
  );
}

export function ModuleListEmptySkeleton() {
  return (
    <Card className="p-8">
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-12 mx-auto rounded" />
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
        <Skeleton className="h-10 w-40 mx-auto" />
      </div>
    </Card>
  );
}
