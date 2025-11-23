"use client";

import { useEffect, useState } from "react";
import { getScheduledReports, deleteScheduledReport, toggleScheduledReportStatus } from "@/lib/actions/scheduledReportActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Mail, Pencil, Trash2, Play, Pause } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ScheduledReport {
  id: string;
  name: string;
  description: string | null;
  dataSource: string;
  frequency: string;
  scheduleTime: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  recipients: string[];
  exportFormat: string;
  active: boolean;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  createdAt: Date;
}

export function ScheduledReportsList() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    const result = await getScheduledReports();
    if (result.success && result.data) {
      setReports(result.data);
    } else {
      toast.error(result.error || "Failed to load scheduled reports");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const result = await deleteScheduledReport(id);
    if (result.success) {
      toast.success("Scheduled report deleted successfully");
      loadReports();
    } else {
      toast.error(result.error || "Failed to delete scheduled report");
    }
    setDeleteId(null);
  }

  async function handleToggleStatus(id: string, active: boolean) {
    const result = await toggleScheduledReportStatus(id, !active);
    if (result.success) {
      toast.success(result.message || "Status updated successfully");
      loadReports();
    } else {
      toast.error(result.error || "Failed to update status");
    }
  }

  function getFrequencyLabel(report: ScheduledReport): string {
    switch (report.frequency) {
      case "daily":
        return `Daily at ${report.scheduleTime}`;
      case "weekly":
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayName = report.dayOfWeek !== null ? days[report.dayOfWeek] : "Unknown";
        return `Weekly on ${dayName} at ${report.scheduleTime}`;
      case "monthly":
        return `Monthly on day ${report.dayOfMonth} at ${report.scheduleTime}`;
      default:
        return report.frequency;
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No scheduled reports</h3>
        <p className="text-muted-foreground mt-2">
          Create your first scheduled report to automate report generation
        </p>
        <Link href="/admin/reports/scheduled/new">
          <Button className="mt-4">Create Scheduled Report</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{report.name}</h3>
                <Badge variant={report.active ? "default" : "secondary"}>
                  {report.active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">{report.exportFormat.toUpperCase()}</Badge>
              </div>
              
              {report.description && (
                <p className="text-sm text-muted-foreground">{report.description}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {getFrequencyLabel(report)}
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {report.recipients.length} recipient{report.recipients.length !== 1 ? "s" : ""}
                </div>
                {report.nextRunAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Next: {new Date(report.nextRunAt).toLocaleString()}
                  </div>
                )}
              </div>
              
              {report.lastRunAt && (
                <p className="text-xs text-muted-foreground">
                  Last run: {new Date(report.lastRunAt).toLocaleString()}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToggleStatus(report.id, report.active)}
                title={report.active ? "Pause" : "Activate"}
              >
                {report.active ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Link href={`/admin/reports/scheduled/${report.id}/edit`}>
                <Button variant="ghost" size="icon" title="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(report.id)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scheduled Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scheduled report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
