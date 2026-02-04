"use client";

/**
 * Document Upload Zone Component
 * Drag-and-drop zone for uploading documents to modules/sub-modules
 * Requirements: 3.1, 3.2, 3.4, 9.1, 9.2
 */

import { useState, useCallback, useRef } from "react";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { R2UploadWidget } from "@/components/upload/r2-upload-widget";
import { validateFileType } from "@/lib/actions/syllabusDocumentActions";
import { cn } from "@/lib/utils";

interface DocumentUploadZoneProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  multiple?: boolean;
  className?: string;
}

export interface UploadedFile {
  file: File;
  fileUrl: string;
  filename: string;
  fileType: string;
  fileSize: number;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function DocumentUploadZone({
  onFilesSelected,
  onUploadError,
  disabled = false,
  multiple = true,
  className,
}: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds maximum limit of 50MB`,
      };
    }

    // Validate file type using server action
    const result = await validateFileType({
      fileType: file.type,
      fileSize: file.size,
    });

    if (!result.success || !result.data?.valid) {
      return {
        valid: false,
        error: result.data?.message || "Invalid file type",
      };
    }

    return { valid: true };
  };

  const uploadFile = useCallback(async (file: File): Promise<UploadedFile> => {
    const uploadedFile: UploadedFile = {
      file,
      fileUrl: "",
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      status: "uploading",
      progress: 0,
    };

    try {
      // Validate file
      const validation = await validateFile(file);
      if (!validation.valid) {
        return {
          ...uploadedFile,
          status: "error",
          error: validation.error,
        };
      }

      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token');
      const { token: csrfToken } = await csrfResponse.json();

      // Prepare form data for R2 upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('csrf_token', csrfToken);
      formData.append('folder', 'syllabus-documents');
      formData.append('category', 'document');

      // Upload to R2 storage
      const response = await fetch('/api/r2/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      return {
        ...uploadedFile,
        fileUrl: result.data.url,
        status: "success",
        progress: 100,
      };
    } catch (error) {
      return {
        ...uploadedFile,
        status: "error",
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }, []);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    if (disabled || isUploading) return;

    setIsUploading(true);
    const fileArray = Array.from(files);

    try {
      // Upload all files
      const uploadPromises = fileArray.map(file => uploadFile(file));
      const uploadedFiles = await Promise.all(uploadPromises);

      // Check for errors
      const failedFiles = uploadedFiles.filter(f => f.status === "error");
      if (failedFiles.length > 0 && onUploadError) {
        const errorMessage = `${failedFiles.length} file(s) failed to upload`;
        onUploadError(errorMessage);
      }

      // Return successfully uploaded files
      const successfulFiles = uploadedFiles.filter(f => f.status === "success");
      if (successfulFiles.length > 0) {
        onFilesSelected(successfulFiles);
      }
    } catch (error) {
      if (onUploadError) {
        onUploadError(error instanceof Error ? error.message : "Upload failed");
      }
    } finally {
      setIsUploading(false);
    }
  }, [disabled, isUploading, onFilesSelected, onUploadError, uploadFile]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        await processFiles(files);
      }
    },
    [disabled, processFiles]
  );

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        onChange={handleFileInputChange}
        disabled={disabled || isUploading}
        className="hidden"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov"
      />

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
          isDragging && "border-primary bg-primary/5",
          !isDragging && "border-muted-foreground/25 hover:border-muted-foreground/50",
          (disabled || isUploading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploading files...</p>
                <p className="text-xs text-muted-foreground">
                  Please wait while we process your files
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {multiple
                    ? "Drop files here or click to browse"
                    : "Drop a file here or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported: PDF, Word, PowerPoint, Images, Videos (max 50MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
