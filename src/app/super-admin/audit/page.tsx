import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuditLogViewer } from "@/components/super-admin/audit/audit-log-viewer";

export default function AuditPage() {
    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">Audit Logs</h1>
                <p className="text-sm text-gray-500 mt-0.5">Complete history of system activities and security events</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                    <AuditLogViewer />
                </Suspense>
            </div>
        </div>
    );
}
