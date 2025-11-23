export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduledReportForm } from "@/components/admin/reports/scheduled-report-form";

export default function NewScheduledReportPage() {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Scheduled Report</CardTitle>
          <CardDescription>
            Configure a report to be automatically generated and emailed on a schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduledReportForm />
        </CardContent>
      </Card>
    </div>
  );
}
