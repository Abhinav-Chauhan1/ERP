"use client";

/**
 * Skeleton Loader for Document List
 * Provides loading state while documents are being fetched
 * Requirements: Task 16 - Loading states
 */

import { Skeleton } from "@/components/ui/skeleton";

interface DocumentListSkeletonProps {
  count?: number;
}

export function DocumentListSkeleton({ count = 2 }: DocumentListSkeletonProps) {
  return (
    <div className="space-y-3">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-36" />
      </div>

      {/* Document items skeleton */}
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <DocumentItemSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

function DocumentItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 border rounded-md bg-accent/50">
      <div className="flex items-center gap-2 flex-1">
        {/* File icon skeleton */}
        <Skeleton className="h-4 w-4 rounded" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-1">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  );
}

export function DocumentListEmptySkeleton() {
  return (
    <div className="text-center py-4 border rounded-md bg-accent/30">
      <Skeleton className="h-4 w-48 mx-auto" />
    </div>
  );
}
