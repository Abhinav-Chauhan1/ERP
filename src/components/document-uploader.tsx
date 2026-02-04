"use client";

import React from 'react';
import { R2DocumentUpload } from "@/components/upload";
import type { DocumentInfo, DocumentUploadResult } from "@/components/upload";

interface DocumentUploaderProps {
  value?: DocumentInfo[];
  onChange: (documents: DocumentInfo[]) => void;
  onSuccess?: (result: DocumentUploadResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  folder?: string;
  label?: string;
  className?: string;
  maxFiles?: number;
  maxSize?: number;
  accept?: string[];
}

export function DocumentUploader({
  value = [],
  onChange,
  onSuccess,
  onError,
  disabled = false,
  folder = "documents",
  label = "Upload Documents",
  className,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  accept = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
}: DocumentUploaderProps) {
  return (
    <R2DocumentUpload
      value={value}
      onChange={onChange}
      onSuccess={onSuccess}
      onError={onError}
      disabled={disabled}
      folder={folder}
      label={label}
      className={className}
      maxFiles={maxFiles}
      maxSize={maxSize}
      accept={accept}
      multiple={true}
      showFileList={true}
      uploadText="Click to upload documents"
      descriptionText="Drag and drop files here, or click to select"
    />
  );
}