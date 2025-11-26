"use client";

/**
 * Secure File Upload Component
 * Provides client-side validation and secure file upload functionality
 * Requirements: 1.2, 9.5
 */

import { useState, useRef, ChangeEvent } from "react";
import { Upload, X, FileIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFetchCsrfToken } from "@/hooks/use-csrf-token";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
  sanitizeFileName,
  validateFileUpload,
  getFileExtension,
} from "@/lib/utils/file-security";

interface SecureFileUploadProps {
  onUploadComplete: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  folder?: string;
  category?: "avatar" | "document" | "attachment" | "general";
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
}

interface UploadResult {
  url: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

interface UploadState {
  status: "idle" | "validating" | "uploading" | "success" | "error";
  progress: number;
  error: string | null;
  file: File | null;
}

export function SecureFileUpload({
  onUploadComplete,
  onUploadError,
  folder,
  category = "general",
  accept,
  maxSizeMB,
  disabled = false,
  className = "",
}: SecureFileUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    error: null,
    file: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token: csrfToken } = useFetchCsrfToken();

  // Generate accept attribute from allowed file types
  const acceptAttribute = accept || Object.keys(ALLOWED_FILE_TYPES).join(",");

  // Get max size for display
  const maxSize = maxSizeMB 
    ? maxSizeMB * 1024 * 1024 
    : MAX_FILE_SIZES[category];
  const maxSizeMBDisplay = Math.round(maxSize / (1024 * 1024));

  /**
   * Client-side file validation
   */
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Validate using utility function
    const validation = validateFileUpload(file, category);
    
    if (!validation.valid) {
      return validation;
    }

    // Additional custom size check if provided
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  };

  /**
   * Handle file selection
   */
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Reset state
    setUploadState({
      status: "validating",
      progress: 0,
      error: null,
      file,
    });

    // Client-side validation
    const validation = validateFile(file);
    
    if (!validation.valid) {
      setUploadState({
        status: "error",
        progress: 0,
        error: validation.error || "Invalid file",
        file: null,
      });
      
      if (onUploadError) {
        onUploadError(validation.error || "Invalid file");
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      return;
    }

    // Start upload
    await uploadFile(file);
  };

  /**
   * Upload file to server
   */
  const uploadFile = async (file: File) => {
    try {
      setUploadState(prev => ({
        ...prev,
        status: "uploading",
        progress: 10,
      }));

      // Prepare form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("csrf_token", csrfToken || "");
      
      if (folder) {
        formData.append("folder", folder);
      }
      
      formData.append("category", category);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 90) + 10;
          setUploadState(prev => ({
            ...prev,
            progress,
          }));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          
          if (response.success) {
            setUploadState({
              status: "success",
              progress: 100,
              error: null,
              file,
            });
            
            onUploadComplete(response.data);
            
            // Reset after success
            setTimeout(() => {
              setUploadState({
                status: "idle",
                progress: 0,
                error: null,
                file: null,
              });
              
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }, 2000);
          } else {
            throw new Error(response.message || "Upload failed");
          }
        } else {
          const response = JSON.parse(xhr.responseText);
          throw new Error(response.message || `Upload failed with status ${xhr.status}`);
        }
      });

      xhr.addEventListener("error", () => {
        throw new Error("Network error during upload");
      });

      xhr.open("POST", "/api/upload");
      xhr.send(formData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      
      setUploadState({
        status: "error",
        progress: 0,
        error: errorMessage,
        file: null,
      });
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setUploadState({
      status: "idle",
      progress: 0,
      error: null,
      file: null,
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Trigger file input click
   */
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const { status, progress, error, file } = uploadState;
  const isUploading = status === "uploading" || status === "validating";
  const isDisabled = disabled || isUploading;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttribute}
        onChange={handleFileChange}
        disabled={isDisabled}
        className="hidden"
        aria-label="File upload input"
      />

      {/* Upload button */}
      {status === "idle" && (
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={isDisabled}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Choose File
        </Button>
      )}

      {/* File info and progress */}
      {file && status !== "idle" && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {sanitizeFileName(file.name)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            
            {status !== "success" && status !== "uploading" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress bar */}
          {(status === "uploading" || status === "validating") && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground flex items-center">
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                {status === "validating" ? "Validating..." : `Uploading... ${progress}%`}
              </p>
            </div>
          )}

          {/* Success message */}
          {status === "success" && (
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Upload successful!
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && status === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Maximum file size: {maxSizeMBDisplay}MB. Allowed types: {acceptAttribute.split(",").slice(0, 3).join(", ")}
        {acceptAttribute.split(",").length > 3 && ` and ${acceptAttribute.split(",").length - 3} more`}
      </p>
    </div>
  );
}
