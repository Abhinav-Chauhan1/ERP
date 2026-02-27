import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { SkeletonTable } from "@/components/shared/loading/skeleton-table";

export default function AcademicYearsLoading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      {/* Academic Years Table */}
      <SkeletonTable rows={5} columns={7} showHeader={true} showPagination={false} />
    </div>
  );
}
