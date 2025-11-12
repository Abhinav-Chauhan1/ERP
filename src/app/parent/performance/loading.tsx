import { Skeleton } from '@/components/ui/skeleton';

export default function PerformanceLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Child selector */}
      <Skeleton className="h-10 w-64" />

      {/* Performance chart */}
      <Skeleton className="h-80 w-full" />

      {/* Results table */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
