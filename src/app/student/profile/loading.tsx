import { SkeletonForm } from "@/components/shared/loading/skeleton-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentProfileLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <Skeleton className="h-8 w-48" />

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-32 w-32 rounded-full" />
              <Skeleton className="h-9 w-32" />
            </div>
            
            {/* Info */}
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-64" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Form */}
      <SkeletonForm fields={6} showHeader={false} />
    </div>
  );
}
