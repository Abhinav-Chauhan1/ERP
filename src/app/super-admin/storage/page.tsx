import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HardDrive } from "lucide-react";
import { getStorageAnalytics } from "@/lib/actions/storage-actions";
import { StorageOverview } from "@/components/super-admin/dashboard/storage-overview";

export default async function StoragePage() {
  const storageResult = await getStorageAnalytics();
  const storage = storageResult.success ? storageResult.data : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <HardDrive className="h-6 w-6 text-red-500" />
          Storage Analytics
        </h1>
        <p className="text-gray-400 mt-1">Monitor platform storage usage across all schools</p>
      </div>

      {/* Storage Overview */}
      <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <CardHeader>
          <CardTitle className="text-white">Storage Usage Overview</CardTitle>
          <CardDescription className="text-gray-400">
            Total storage consumption and distribution across schools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <StorageOverview storageData={storage} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}