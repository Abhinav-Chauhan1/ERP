"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

/**
 * Image upload result interface
 */
export interface ImageUploadResult {
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
 * R2 Image Upload Props
 */
export interface R2ImageUploadProps {
  /** Current image URL value */
  value?: string;
  /** Callback when image changes */
  onChange: (url: string) => void;
  /** Callback when upload succeeds */
  onSuccess?: (result: ImageUploadResult) => void;
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
  /** Maximum file size in bytes (default: 5MB) */
  maxSize?: number;
  /** Accepted image types */
  accept?: string[];
  /** Generate thumbnails */
  generateThumbnails?: boolean;
  /** Custom metadata */
  customMetadata?: Record<string, string>;
  /** Image dimensions for display */
  width?: number;
  height?: number;
  /** Show manual URL input */
  showUrlInput?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * R2 Image Upload Component
 * 
 * A specialized image upload component that replaces Cloudinary image uploads with:
 * - Image preview and thumbnail display
 * - Drag and drop functionality
 * - Progress tracking and error handling
 * - Storage quota checking
 * - Manual URL input as fallback
 */
export function R2ImageUpload({
  value,
  onChange,
  onSuccess,
  onError,
  disabled = false,
  folder = 'images',
  label,
  className,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  generateThumbnails = true,
  customMetadata = {},
  width = 200,
  height = 200,
  showUrlInput = true,
  placeholder = 'https://example.com/image.png',
}: R2ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);
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
   * Validate image file
   */
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please upload an image file';
    }

    // Check accepted types
    if (accept.length > 0 && !accept.includes(file.type)) {
      return `Image type ${file.type} is not supported`;
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `Image size should be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  /**
   * Upload image to R2
   */
  const uploadImage = async (file: File): Promise<void> => {
    try {
      setIsUploading(true);

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
      formData.append('category', 'image');
      formData.append('generateThumbnails', generateThumbnails.toString());
      formData.append('customMetadata', JSON.stringify(customMetadata));

      // Upload to R2
      const response = await fetch('/api/r2/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update value and call callbacks
      const uploadResult: ImageUploadResult = {
        success: true,
        url: result.data.url,
        key: result.data.key,
        metadata: result.data.metadata,
      };

      onChange(result.data.url);
      onSuccess?.(uploadResult);
      toast.success('Image uploaded successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('Image upload error:', error);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled || isUploading) return;

    const file = files[0]; // Only take the first file for single image upload
    await uploadImage(file);
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
   * Remove current image
   */
  const removeImage = () => {
    if (!disabled && !isUploading) {
      onChange('');
    }
  };

  /**
   * Handle manual URL input
   */
  const handleUrlChange = (url: string) => {
    if (!disabled && !isUploading) {
      onChange(url);
    }
  };

  return (
    <div className={cn('space-y-4 w-full', className)}>
      {label && <Label>{label}</Label>}

      {/* Storage Quota Warning */}
      {quotaWarning && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{quotaWarning}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-4">
        {value ? (
          /* Image Preview */
          <div className="relative rounded-md overflow-hidden border" style={{ width, height }}>
            <div className="absolute top-2 right-2 z-10">
              <Button
                type="button"
                onClick={removeImage}
                variant="destructive"
                size="icon"
                className="h-6 w-6"
                disabled={disabled || isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Image
              fill
              className="object-cover"
              alt="Uploaded image"
              src={value}
              unoptimized
            />
          </div>
        ) : (
          /* Upload Area */
          <div
            className={cn(
              'rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer',
              isDragOver && 'border-primary bg-primary/5',
              (disabled || isUploading) && 'opacity-50 cursor-not-allowed',
              !isDragOver && 'border-muted-foreground/25 bg-muted/50 hover:bg-muted/80'
            )}
            style={{ width, height }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            {isUploading ? (
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Click to upload</span>
                <span className="text-xs text-muted-foreground">or drag and drop</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Manual URL Entry */}
      {showUrlInput && (
        <div className="space-y-2">
          <Label htmlFor="image-url" className="text-xs text-muted-foreground">
            Or paste image URL
          </Label>
          <div className="flex gap-2">
            <Input
              id="image-url"
              value={value || ''}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={disabled || isUploading}
              placeholder={placeholder}
              className="text-sm"
            />
          </div>
        </div>
      )}

      {/* Upload Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>Recommended size: {width}x{height}px. Max size: {Math.round(maxSize / (1024 * 1024))}MB.</p>
        {accept.length > 0 && (
          <p>Supported formats: {accept.map(type => type.split('/')[1]).join(', ').toUpperCase()}</p>
        )}
      </div>
    </div>
  );
}