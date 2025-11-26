import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CourseDetailLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Course Header Skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Thumbnail Skeleton */}
            <div className="md:col-span-1">
              <Skeleton className="aspect-video md:aspect-square w-full rounded-t-lg md:rounded-l-lg md:rounded-tr-none" />
            </div>

            {/* Course Info Skeleton */}
            <div className="md:col-span-2 p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <Skeleton className="h-9 w-3/4" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full mt-2" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </div>

                <div className="h-px bg-border" />

                {/* Metadata Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>

                {/* Action Button Skeleton */}
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Modules Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
