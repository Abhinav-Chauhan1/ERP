import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EnhancedSchoolManagement } from "@/components/super-admin/schools/enhanced-school-management";

export default async function SchoolsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Schools Management</h1>
        <p className="text-gray-400 mt-1">Manage all registered schools on the platform</p>
      </div>

      {/* Schools Management Component */}
      <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <CardContent className="p-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <EnhancedSchoolManagement />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}