export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduledReportForm } from "@/components/admin/reports/scheduled-report-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewScheduledReportPage() {
  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      <div className="flex flex-col gap-1">
        <Link href="/admin/reports/scheduled">
          <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Scheduled Reports
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Scheduled Report</h1>
          <p className="text-muted-foreground mt-1">
            Configure a report to be automatically generated and emailed on a schedule
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>
            Set up the report details and schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduledReportForm />
        </CardContent>
      </Card>
    </div>
  );
}
