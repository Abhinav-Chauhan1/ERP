import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { AuditLogViewer } from "@/components/super-admin/audit/audit-log-viewer";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="h-6 w-6 text-red-500" />
          Audit Logs
        </h1>
        <p className="text-gray-400 mt-1">View audit logs, compliance reports, and security events</p>
      </div>

      {/* Audit Logs */}
      <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <CardHeader>
          <CardTitle className="text-white">Activity Log</CardTitle>
          <CardDescription className="text-gray-400">
            Complete history of all system activities and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <AuditLogViewer />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}