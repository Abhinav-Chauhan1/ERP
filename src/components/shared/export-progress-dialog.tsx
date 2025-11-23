"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BackgroundExportJob, getJobStatus } from "@/lib/utils/background-export";

interface ExportProgressDialogProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportProgressDialog({
  jobId,
  open,
  onOpenChange,
}: ExportProgressDialogProps) {
  const [job, setJob] = useState<BackgroundExportJob | null>(null);

  useEffect(() => {
    if (!jobId || !open) return;

    // Poll for job status
    const interval = setInterval(() => {
      const currentJob = getJobStatus(jobId);
      setJob(currentJob);

      // Stop polling if job is completed or failed
      if (currentJob && (currentJob.status === 'completed' || currentJob.status === 'failed')) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [jobId, open]);

  if (!job) return null;

  const isProcessing = job.status === 'processing' || job.status === 'pending';
  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isProcessing && "Exporting Data..."}
            {isCompleted && "Export Complete"}
            {isFailed && "Export Failed"}
          </DialogTitle>
          <DialogDescription>
            {isProcessing && `Processing ${job.totalRecords.toLocaleString()} records`}
            {isCompleted && "Your export is ready"}
            {isFailed && "An error occurred during export"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isProcessing && (
            <>
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <Progress value={job.progress} className="w-full" />
              <div className="text-sm text-center text-muted-foreground">
                {job.processedRecords.toLocaleString()} of {job.totalRecords.toLocaleString()} records processed
                ({job.progress}%)
              </div>
            </>
          )}

          {isCompleted && (
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-sm text-center text-muted-foreground">
                Successfully exported {job.totalRecords.toLocaleString()} records
              </p>
              <Button onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}

          {isFailed && (
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-sm text-center text-muted-foreground">
                {job.error || "An unknown error occurred"}
              </p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
