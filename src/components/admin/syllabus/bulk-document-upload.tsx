"use client";

/**
 * Bulk Document Upload Component
 * Upload multiple documents with progress tracking
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DocumentUploadZone, UploadedFile } from "./document-upload-zone";
import { bulkUploadDocuments } from "@/lib/actions/syllabusDocumentActions";
import { FileUploadProgress, BulkUploadSummary } from "../../academic/file-upload-progress";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkDocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId?: string;
  subModuleId?: string;
  uploadedBy: string;
  onSuccess?: () => void;
}

interface FileStatus extends UploadedFile {
  uploadStatus?: "pending" | "uploading" | "success" | "error";
  uploadError?: string;
}

export function BulkDocumentUpload({
  open,
  onOpenChange,
  moduleId,
  subModuleId,
  uploadedBy,
  onSuccess,
}: BulkDocumentUploadProps) {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  const handleFilesSelected = (uploadedFiles: UploadedFile[]) => {
    const newFiles: FileStatus[] = uploadedFiles.map((file) => ({
      ...file,
      uploadStatus: "pending",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleUploadError = (error: string) => {
    toast({
      title: "Upload Error",
      description: error,
      variant: "destructive",
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast({
        title: "No files",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Prepare documents for bulk upload
      const documents = files.map((file) => ({
        filename: file.filename,
        fileUrl: file.fileUrl,
        fileType: file.fileType,
        fileSize: file.fileSize,
        title: file.filename, // Will use filename as default title
        moduleId,
        subModuleId,
        uploadedBy,
      }));

      // Update file statuses to uploading
      setFiles((prev) =>
        prev.map((file) => ({
          ...file,
          uploadStatus: "uploading",
          progress: 0,
        }))
      );

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const next = prev + 10;
          return next > 90 ? 90 : next;
        });
      }, 200);

      // Call bulk upload action
      const result = await bulkUploadDocuments({ documents });

      clearInterval(progressInterval);

      if (result.success && result.data) {
        const { successful, failed, summary } = result.data;

        // Update file statuses
        setFiles((prev) =>
          prev.map((file) => {
            const isSuccess = successful.some(
              (s: any) => s.filename === file.filename
            );
            const failedItem = failed.find((f) => f.filename === file.filename);

            return {
              ...file,
              uploadStatus: isSuccess ? "success" : "error",
              uploadError: failedItem?.error,
              progress: isSuccess ? 100 : file.progress || 0,
            };
          })
        );

        setUploadProgress(100);

        // Show summary toast
        if (summary.failed === 0) {
          toast({
            title: "Upload Complete",
            description: `Successfully uploaded ${summary.successful} document(s).`,
          });
        } else {
          toast({
            title: "Upload Partially Complete",
            description: `${summary.successful} succeeded, ${summary.failed} failed.`,
            variant: "destructive",
          });
        }

        // Close dialog after a delay if all succeeded
        if (summary.failed === 0) {
          setTimeout(() => {
            onOpenChange(false);
            setFiles([]);
            if (onSuccess) {
              onSuccess();
            }
            router.refresh();
          }, 2000);
        }
      } else {
        throw new Error(result.error || "Bulk upload failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload documents",
        variant: "destructive",
      });
      setFiles((prev) =>
        prev.map((file) => ({
          ...file,
          uploadStatus: "error",
          uploadError: "Upload failed",
          progress: 0,
        }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false);
      setFiles([]);
      setUploadProgress(0);
    }
  };

  const successCount = files.filter((f) => f.uploadStatus === "success").length;
  const errorCount = files.filter((f) => f.uploadStatus === "error").length;
  const pendingCount = files.filter((f) => f.uploadStatus === "pending").length;
  const uploadingCount = files.filter((f) => f.uploadStatus === "uploading").length;

  // Convert files to FileUploadStatus format for the progress component
  const fileUploadStatuses = files.map((file) => ({
    filename: file.filename,
    fileSize: file.fileSize,
    status: file.uploadStatus || "pending",
    progress: file.progress || 0,
    error: file.uploadError,
  }));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Documents</DialogTitle>
          <DialogDescription>
            Upload multiple documents at once. Each file will be validated and
            uploaded individually.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Zone */}
          {!isUploading && (
            <DocumentUploadZone
              onFilesSelected={handleFilesSelected}
              onUploadError={handleUploadError}
              multiple
            />
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  Files ({files.length})
                </h4>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles([])}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Bulk Upload Summary */}
              {isUploading && (
                <BulkUploadSummary
                  total={files.length}
                  successful={successCount}
                  failed={errorCount}
                  inProgress={uploadingCount}
                />
              )}

              {/* File Upload Progress */}
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <FileUploadProgress files={fileUploadStatuses} />
              </ScrollArea>

              {/* Summary Alert */}
              {!isUploading && (successCount > 0 || errorCount > 0) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {successCount > 0 && (
                      <span className="text-green-600 dark:text-green-400">
                        {successCount} succeeded
                      </span>
                    )}
                    {successCount > 0 && errorCount > 0 && ", "}
                    {errorCount > 0 && (
                      <span className="text-destructive">
                        {errorCount} failed
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            {successCount > 0 && errorCount === 0 ? "Close" : "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isUploading || files.length === 0 || pendingCount === 0}
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? "Uploading..." : `Upload ${pendingCount} File(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
