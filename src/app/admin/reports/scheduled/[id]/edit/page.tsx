import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduledReportForm } from "@/components/admin/reports/scheduled-report-form";
import { getScheduledReport } from "@/lib/actions/scheduledReportActions";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditScheduledReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getScheduledReport(id);

  if (!result.success || !result.data) {
    notFound();
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Edit Scheduled Report</h1>
          <p className="text-muted-foreground mt-1">
            Update the configuration for this scheduled report
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Scheduled Report</CardTitle>
          <CardDescription>
            Update the configuration for this scheduled report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduledReportForm initialData={result.data} reportId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
