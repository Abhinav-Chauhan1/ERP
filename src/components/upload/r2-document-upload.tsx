"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, AlertCircle, File, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

/**
 * Document upload result interface
 */
export interface DocumentUploadResult {
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
 * Document info interface
 */
export interface DocumentInfo {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

/**
 * R2 Document Upload Props
 */
export interface R2DocumentUploadProps {
  /** Current documents array */
  value?: DocumentInfo[];
  /** Callback when documents change */
  onChange: (documents: DocumentInfo[]) => void;
  /** Callback when upload succeeds */
  onSuccess?: (result: DocumentUploadResult) => void;
  /** Callback when upload fails */
  onError?: (error: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Upload folder within school structure */
  folder?: string;
  /** Component label */
  label?: string;
  /** Custom CSS classes */
  className?: string;
  /** Maximum file size in bytes (default: 50MB) */
  maxSize?: number;
  /** Accepted document types */
  accept?: string[];
  /** Maximum number of documents */
  maxFiles?: number;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Custom metadata */
  customMetadata?: Record<string, string>;
  /** Show file list */
  showFileList?: boolean;
  /** Upload text */
  uploadText?: string;
  /** Description text */
  descriptionText?: string;
}

/**
 * R2 Document Upload Component
 * 
 * A specialized document upload component that replaces Cloudinary document uploads with:
 * - Document preview and file list
 * - Drag and drop functionality
 * - Progress tracking and error handling
 * - Storage quota checking
 * - Multiple document support
 */
export function R2DocumentUpload({
  value = [],
  onChange,
  onSuccess,
  onError,
  disabled = false,
  folder = 'documents',
  label,
  className,
  maxSize = 50 * 1024 * 1024, // 50MB default
  accept = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  maxFiles = 10,
  multiple = true,
  customMetadata = {},
  showFileList = true,
  uploadText = 'Click to upload documents',
  descriptionText = 'Drag and drop files here, or click to select',
}: R2DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  /**
   * Check storage quota
   */
  const checkStorageQuota = async () => {
    try {
      const response = await fetch('/api/storage/quota');
      if (response.ok) {
        const quota = await response.json();
        if (quota.percentageUsed >= 80) {
          setQuotaWarning(
            `Storage ${quota.percentageUsed.toFixed(1)}% full`
          );
        }
        if (quota.percentageUsed >= 100) {
          setQuotaWarning('Storage quota exceeded');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to check storage quota:', error);
      return true; // Allow upload if quota check fails
    }
  };

  /**
   * Validate document file
   */
  const validateFile = (file: File): string | null => {
    // Check accepted types
    if (accept.length > 0 && !accept.includes(file.type)) {
      return `Document type ${file.type} is not supported`;
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `Document size should be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  /**
   * Upload document to R2
   */
  const uploadDocument = async (file: File): Promise<DocumentInfo | null> => {
    try {
      // Check quota before upload
      const canUpload = await checkStorageQuota();
      if (!canUpload) {
        throw new Error('Storage quota exceeded');
      }

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token');
      const { token: csrfToken } = await csrfResponse.json();

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('csrf_token', csrfToken);
      formData.append('folder', folder);
      formData.append('category', 'document');
      formData.append('generateThumbnails', 'false');
      formData.append('customMetadata', JSON.stringify(customMetadata));

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      const fileId = `${Date.now()}-${Math.random()}`;

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(prev => ({ ...prev, [fileId]: percentage }));
          }
        });

        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);
            
            if (xhr.status === 200 && response.success) {
              const documentInfo: DocumentInfo = {
                name: file.name,
                url: response.data.url,
                size: file.size,
                type: file.type,
                uploadedAt: new Date(),
              };

              const uploadResult: DocumentUploadResult = {
                success: true,
                url: response.data.url,
                key: response.data.key,
                metadata: response.data.metadata,
              };

              onSuccess?.(uploadResult);
              setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[fileId];
                return newProgress;
              });
              resolve(documentInfo);
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
      console.error('Document upload error:', error);
      onError?.(errorMessage);
      toast.error(`${file.name}: ${errorMessage}`);
      return null;
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled || isUploading) return;

    // Check max files limit
    if (value.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} documents allowed`);
      return;
    }

    setIsUploading(true);

    try {
      const fileArray = Array.from(files);
      const uploadPromises = fileArray.map(file => uploadDocument(file));
      const results = await Promise.all(uploadPromises);
      
      // Filter out failed uploads and add successful ones
      const successfulUploads = results.filter((result): result is DocumentInfo => result !== null);
      
      if (successfulUploads.length > 0) {
        onChange([...value, ...successfulUploads]);
        toast.success(`${successfulUploads.length} document(s) uploaded successfully`);
      }

    } catch (error) {
      console.error('Batch upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle drag events
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUploading) return;
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
    
    if (disabled || isUploading) return;
    
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
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  /**
   * Remove document from list
   */
  const removeDocument = (index: number) => {
    if (!disabled && !isUploading) {
      const newDocuments = value.filter((_, i) => i !== index);
      onChange(newDocuments);
    }
  };

  /**
   * Clear all documents
   */
  const clearAllDocuments = () => {
    if (!disabled && !isUploading) {
      onChange([]);
    }
  };

  /**
   * Get file type icon
   */
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (mimeType.includes('word')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileText className="h-5 w-5 text-green-500" />;
    if (mimeType.includes('text')) return <FileText className="h-5 w-5 text-gray-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasDocuments = value.length > 0;
  const hasUploadProgress = Object.keys(uploadProgress).length > 0;

  return (
    <div className={cn('w-full space-y-4', className)}>
      {label && <Label>{label}</Label>}

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
          (disabled || isUploading) && 'opacity-50 cursor-not-allowed',
          !isDragOver && 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground" />
          )}
          <p className="font-medium">
            {isUploading ? 'Uploading...' : uploadText}
          </p>
          <p className="text-sm text-muted-foreground">{descriptionText}</p>
          {accept.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Accepted types: {accept.map(type => {
                const ext = type.split('/').pop();
                return ext === 'pdf' ? 'PDF' : 
                       ext === 'msword' ? 'DOC' :
                       ext?.includes('wordprocessing') ? 'DOCX' :
                       ext?.includes('excel') ? 'XLS' :
                       ext?.includes('spreadsheet') ? 'XLSX' :
                       ext?.toUpperCase();
              }).join(', ')}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Max size: {Math.round(maxSize / (1024 * 1024))}MB • Max files: {maxFiles}
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
        disabled={disabled || isUploading}
      />

      {/* Upload Progress */}
      {hasUploadProgress && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploading files...</p>
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Document List */}
      {hasDocuments && showFileList && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Uploaded Documents ({value.length})</h4>
            <Button
              variant="outline"
              onClick={clearAllDocuments}
              disabled={disabled || isUploading}
              size="sm"
            >
              Clear All
            </Button>
          </div>

          <div className="grid gap-3">
            {value.map((document, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                {/* File Icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(document.type)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{document.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {document.type.split('/').pop()?.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(document.size)} • Uploaded {document.uploadedAt.toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(document.url, '_blank')}
                    disabled={disabled}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocument(index)}
                    disabled={disabled || isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}