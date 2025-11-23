import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduledReportForm } from "@/components/admin/reports/scheduled-report-form";
import { getScheduledReport } from "@/lib/actions/scheduledReportActions";
import { notFound } from "next/navigation";

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
    <div className="container mx-auto py-6 max-w-4xl">
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
