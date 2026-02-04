"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

/**
 * File upload result interface
 */
export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  metadata?: {
    id: string;
    originalName: string;
    size: number;
    mimeType: string;
    folder: string;
  };
  error?: string;
}

/**
 * Upload progress interface
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * File preview interface
 */
export interface FilePreview {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: UploadProgress;
  result?: UploadResult;
  error?: string;
}

/**
 * R2 Upload Widget Props
 */
export interface R2UploadWidgetProps {
  /** Callback when upload succeeds */
  onSuccess?: (result: UploadResult) => void;
  /** Callback when upload fails */
  onError?: (error: string) => void;
  /** Callback for upload progress */
  onProgress?: (progress: UploadProgress) => void;
  /** Maximum number of files to upload */
  maxFiles?: number;
  /** Accepted file types (MIME types) */
  accept?: string[];
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Upload folder within school structure */
  folder?: string;
  /** File category for validation */
  category?: 'image' | 'document';
  /** Generate thumbnails for images */
  generateThumbnails?: boolean;
  /** Custom metadata to include */
  customMetadata?: Record<string, string>;
  /** Disabled state */
  disabled?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Show file previews */
  showPreviews?: boolean;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Custom upload text */
  uploadText?: string;
  /** Custom description text */
  descriptionText?: string;
}

/**
 * R2 Upload Widget Component
 * 
 * A comprehensive file upload component that replaces CldUploadWidget with:
 * - Drag and drop functionality
 * - Progress tracking and error handling
 * - File previews and thumbnails
 * - Storage quota checking and warnings
 * - School-aware uploads with R2 integration
 */
export function R2UploadWidget({
  onSuccess,
  onError,
  onProgress,
  maxFiles = 10,
  accept = [],
  maxSize = 50 * 1024 * 1024, // 50MB default
  folder = 'general',
  category,
  generateThumbnails = false,
  customMetadata = {},
  disabled = false,
  className,
  showPreviews = true,
  multiple = true,
  uploadText = 'Click to upload files',
  descriptionText = 'Drag and drop files here, or click to select',
}: R2UploadWidgetProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Check storage quota on component mount
  useEffect(() => {
    checkStorageQuota();
  }, []);

  /**
   * Check storage quota and show warnings if needed
   */
  const checkStorageQuota = async () => {
    try {
      const response = await fetch('/api/storage/quota');
      if (response.ok) {
        const quota = await response.json();
        if (quota.percentageUsed >= 80) {
          setQuotaWarning(
            `Storage ${quota.percentageUsed.toFixed(1)}% full (${quota.currentUsageMB}MB / ${quota.maxLimitMB}MB)`
          );
        }
        if (quota.percentageUsed >= 100) {
          setQuotaWarning('Storage quota exceeded. Please contact administrator.');
        }
      }
    } catch (error) {
      console.error('Failed to check storage quota:', error);
    }
  };

  /**
   * Validate file before upload
   */
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    // Check file type if accept array is provided
    if (accept.length > 0 && !accept.includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }

    // Category-specific validation
    if (category === 'image' && !file.type.startsWith('image/')) {
      return 'Only image files are allowed';
    }

    if (category === 'document' && file.type.startsWith('image/')) {
      return 'Only document files are allowed';
    }

    return null;
  };

  /**
   * Create file preview URL for images
   */
  const createPreview = (file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles || disabled) return;

    const newFiles: FilePreview[] = [];
    const fileArray = Array.from(selectedFiles);

    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
        continue;
      }

      const filePreview: FilePreview = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: createPreview(file),
        status: 'pending',
      };

      newFiles.push(filePreview);
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles, disabled, accept, maxSize, category]);

  /**
   * Upload single file to R2
   */
  const uploadFile = async (filePreview: FilePreview): Promise<void> => {
    try {
      // Update file status to uploading
      setFiles(prev => prev.map(f => 
        f.id === filePreview.id 
          ? { ...f, status: 'uploading', progress: { loaded: 0, total: filePreview.file.size, percentage: 0 } }
          : f
      ));

      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token');
      const { token: csrfToken } = await csrfResponse.json();

      // Prepare form data
      const formData = new FormData();
      formData.append('file', filePreview.file);
      formData.append('csrf_token', csrfToken);
      formData.append('folder', folder);
      if (category) formData.append('category', category);
      formData.append('generateThumbnails', generateThumbnails.toString());
      formData.append('customMetadata', JSON.stringify(customMetadata));

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            };

            // Update file progress
            setFiles(prev => prev.map(f => 
              f.id === filePreview.id ? { ...f, progress } : f
            ));

            // Call progress callback
            onProgress?.(progress);
          }
        });

        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);
            
            if (xhr.status === 200 && response.success) {
              const result: UploadResult = {
                success: true,
                url: response.data.url,
                key: response.data.key,
                metadata: response.data.metadata,
              };

              // Update file status to success
              setFiles(prev => prev.map(f => 
                f.id === filePreview.id 
                  ? { ...f, status: 'success', result }
                  : f
              ));

              onSuccess?.(result);
              resolve();
            } else {
              throw new Error(response.error || 'Upload failed');
            }
          } catch (error) {
            reject(error);
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', '/api/r2/upload');
        xhr.send(formData);
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      // Update file status to error
      setFiles(prev => prev.map(f => 
        f.id === filePreview.id 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));

      onError?.(errorMessage);
      toast.error(`${filePreview.file.name}: ${errorMessage}`);
    }
  };

  /**
   * Upload all pending files
   */
  const uploadAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of pendingFiles) {
        await uploadFile(file);
      }
      
      toast.success(`${pendingFiles.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('Batch upload error:', error);
    } finally {
      setIsUploading(false);
      // Refresh quota after uploads
      checkStorageQuota();
    }
  };

  /**
   * Remove file from list
   */
  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  /**
   * Clear all files
   */
  const clearAllFiles = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  };

  /**
   * Handle drag events
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  /**
   * Handle file input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  /**
   * Open file dialog
   */
  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const hasFiles = files.length > 0;
  const hasPendingFiles = files.some(f => f.status === 'pending');
  const hasUploadingFiles = files.some(f => f.status === 'uploading');

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Storage Quota Warning */}
      {quotaWarning && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{quotaWarning}</AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          isDragOver && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed',
          !isDragOver && 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">{uploadText}</p>
          <p className="text-sm text-muted-foreground">{descriptionText}</p>
          {accept.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Accepted types: {accept.join(', ')}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Max size: {Math.round(maxSize / (1024 * 1024))}MB
          </p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* File Previews */}
      {hasFiles && showPreviews && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Selected Files ({files.length})</h4>
            <div className="flex gap-2">
              {hasPendingFiles && (
                <Button
                  onClick={uploadAllFiles}
                  disabled={isUploading || disabled}
                  size="sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload All'
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={clearAllFiles}
                disabled={hasUploadingFiles || disabled}
                size="sm"
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            {files.map((file) => (
              <FilePreviewItem
                key={file.id}
                filePreview={file}
                onRemove={() => removeFile(file.id)}
                onUpload={() => uploadFile(file)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual File Preview Item Component
 */
interface FilePreviewItemProps {
  filePreview: FilePreview;
  onRemove: () => void;
  onUpload: () => void;
  disabled?: boolean;
}

function FilePreviewItem({ filePreview, onRemove, onUpload, disabled }: FilePreviewItemProps) {
  const { file, preview, status, progress, result, error } = filePreview;
  const isImage = file.type.startsWith('image/');

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Upload className="h-4 w-4 text-muted-foreground" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'uploading':
        return <Badge variant="default">Uploading</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      {/* File Icon/Preview */}
      <div className="flex-shrink-0">
        {preview ? (
          <img
            src={preview}
            alt={file.name}
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
            {isImage ? (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            ) : (
              <FileText className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <p className="font-medium truncate">{file.name}</p>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-muted-foreground">
          {(file.size / 1024).toFixed(1)} KB • {file.type}
        </p>
        
        {/* Progress Bar */}
        {status === 'uploading' && progress && (
          <div className="mt-2">
            <Progress value={progress.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {progress.percentage}% ({(progress.loaded / 1024).toFixed(1)} KB / {(progress.total / 1024).toFixed(1)} KB)
            </p>
          </div>
        )}

        {/* Error Message */}
        {status === 'error' && error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}

        {/* Success URL */}
        {status === 'success' && result?.url && (
          <p className="text-sm text-green-600 mt-1 truncate">
            Uploaded: {result.url}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {status === 'pending' && (
          <Button
            size="sm"
            onClick={onUpload}
            disabled={disabled}
          >
            Upload
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={status === 'uploading' || disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}