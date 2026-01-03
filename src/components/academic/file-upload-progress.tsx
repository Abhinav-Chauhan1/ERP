"use client";

/**
 * File Upload Progress Component
 * Shows progress indicators for individual and bulk file uploads
 * Requirements: Task 16 - Loading spinners for file uploads
 */

import { Loader2, CheckCircle2, XCircle, FileText, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface FileUploadStatus {
  filename: string;
  fileSize: number;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

interface FileUploadProgressProps {
  files: FileUploadStatus[];
  className?: string;
}

export function FileUploadProgress({ files, className }: FileUploadProgressProps) {
  const totalFiles = files.length;
  const completedFiles = files.filter(
    (f) => f.status === "success" || f.status === "error"
  ).length;
  const overallProgress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall progress */}
      {totalFiles > 1 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">
              {completedFiles} / {totalFiles} files
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      )}

      {/* Individual file progress */}
      <div className="space-y-2">
        {files.map((file, index) => (
          <FileUploadItem key={index} file={file} />
        ))}
      </div>
    </div>
  );
}

function FileUploadItem({ file }: { file: FileUploadStatus }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        file.status === "success" &&
          "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900",
        file.status === "error" &&
          "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
        file.status === "uploading" && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
      )}
    >
      <div className="flex-shrink-0">
        {file.status === "pending" && (
          <FileText className="h-5 w-5 text-muted-foreground" />
        )}
        {file.status === "uploading" && (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        )}
        {file.status === "success" && (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        )}
        {file.status === "error" && (
          <XCircle className="h-5 w-5 text-destructive" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">{file.filename}</p>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {(file.fileSize / 1024).toFixed(1)} KB
          </span>
        </div>

        {file.status === "uploading" && (
          <Progress value={file.progress} className="h-1" />
        )}

        {file.error && (
          <p className="text-xs text-destructive">{file.error}</p>
        )}

        {file.status === "success" && (
          <p className="text-xs text-green-600 dark:text-green-400">
            Upload complete
          </p>
        )}
      </div>
    </div>
  );
}

interface SingleFileUploadProgressProps {
  filename: string;
  progress: number;
  status: "uploading" | "processing" | "complete";
  className?: string;
}

export function SingleFileUploadProgress({
  filename,
  progress,
  status,
  className,
}: SingleFileUploadProgressProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3">
        <Upload className="h-5 w-5 text-primary animate-pulse" />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">{filename}</p>
          <p className="text-xs text-muted-foreground">
            {status === "uploading" && "Uploading..."}
            {status === "processing" && "Processing..."}
            {status === "complete" && "Upload complete"}
          </p>
        </div>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

interface BulkUploadSummaryProps {
  total: number;
  successful: number;
  failed: number;
  inProgress: number;
  className?: string;
}

export function BulkUploadSummary({
  total,
  successful,
  failed,
  inProgress,
  className,
}: BulkUploadSummaryProps) {
  return (
    <div className={cn("grid grid-cols-4 gap-4", className)}>
      <div className="text-center p-3 rounded-lg border bg-card">
        <p className="text-2xl font-bold">{total}</p>
        <p className="text-xs text-muted-foreground">Total</p>
      </div>
      <div className="text-center p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
        <p className="text-2xl font-bold text-green-600">{successful}</p>
        <p className="text-xs text-muted-foreground">Success</p>
      </div>
      <div className="text-center p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
        <p className="text-2xl font-bold text-destructive">{failed}</p>
        <p className="text-xs text-muted-foreground">Failed</p>
      </div>
      <div className="text-center p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
        <p className="text-2xl font-bold text-blue-600">{inProgress}</p>
        <p className="text-xs text-muted-foreground">In Progress</p>
      </div>
    </div>
  );
}
