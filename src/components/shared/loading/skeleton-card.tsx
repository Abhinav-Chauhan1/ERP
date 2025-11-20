import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  showHeader?: boolean;
  showFooter?: boolean;
  contentLines?: number;
}

export function SkeletonCard({ 
  showHeader = true, 
  showFooter = false,
  contentLines = 3 
}: SkeletonCardProps) {
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: contentLines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
      {showFooter && (
        <div className="px-6 pb-6">
          <Skeleton className="h-9 w-24" />
        </div>
      )}
    </Card>
  );
}

export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} showHeader={false} contentLines={2} />
      ))}
    </div>
  );
}
