import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getStorageAnalytics } from "@/lib/actions/storage-actions";
import { StorageOverview } from "@/components/super-admin/dashboard/storage-overview";

export default async function StoragePage() {
    const storageResult = await getStorageAnalytics();
    const storage = storageResult.success ? storageResult.data : null;

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">Storage</h1>
                <p className="text-sm text-gray-500 mt-0.5">Monitor storage usage and quotas across all schools</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                    <StorageOverview storageData={storage} />
                </Suspense>
            </div>
        </div>
    );
}
