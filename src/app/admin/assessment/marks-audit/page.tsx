export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { History, ArrowLeft } from "lucide-react";
import { MarksAuditLogViewer } from "@/components/admin/marks-audit-log-viewer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MarksAuditPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/assessment/marks-entry">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Marks Entry Audit Logs</h1>
        </div>
      </div>
      <p className="text-muted-foreground -mt-2 ml-1">
        View history of marks entry and modifications
      </p>

      <Alert>
        <History className="h-4 w-4" />
        <AlertDescription>
          Track all marks entry and modification activities. Filter by exam, student, date range, or user.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log History</CardTitle>
          <CardDescription>
            View detailed logs of who entered or modified marks and when
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MarksAuditLogViewer />
        </CardContent>
      </Card>
    </div>
  );
}
