import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for primary stats section
 * Matches the dimensions of 4 stat cards
 */
export function PrimaryStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for secondary stats section
 * Matches the dimensions of 4 stat cards
 */
export function SecondaryStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for charts section
 * Matches the dimensions of 2 chart cards
 */
export function ChartsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for activity section
 * Matches the dimensions of enrollment chart, activity feed, and calendar
 */
export function ActivitySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Enrollment Distribution */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Widget */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Skeleton loader for quick actions and notifications section
 * Matches the dimensions of quick actions and notifications cards
 */
export function QuickActionsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
      {/* Quick Actions */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 p-2">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
