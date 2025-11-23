import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SkeletonListProps {
  items?: number;
  showHeader?: boolean;
  showActions?: boolean;
}

/**
 * Skeleton loader for generic list views
 * Matches the dimensions of card-based list items
 */
export function SkeletonList({ 
  items = 6,
  showHeader = true,
  showActions = true
}: SkeletonListProps) {
  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}

      <div className="grid gap-4">
        {Array.from({ length: items }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              {showActions && (
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for grid-based list views
 */
export function SkeletonGrid({ 
  items = 6,
  columns = 3
}: { 
  items?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div 
        className="grid gap-4"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` 
        }}
      >
        {Array.from({ length: items }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
