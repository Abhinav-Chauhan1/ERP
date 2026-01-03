"use client";

import { FileText, Image as ImageIcon, File, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DocumentViewerProps {
  fileUrl: string;
  fileType: string;
  fileName: string;
}

export function DocumentViewer({ fileUrl, fileType, fileName }: DocumentViewerProps) {
  // PDF files
  if (fileType === 'application/pdf') {
    return (
      <div className="w-full h-[600px] border rounded-lg overflow-hidden">
        <iframe
          src={`${fileUrl}#toolbar=0`}
          className="w-full h-full"
          title={fileName}
        />
      </div>
    );
  }

  // Image files
  if (fileType?.startsWith('image/')) {
    return (
      <div className="w-full border rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileUrl}
          alt={fileName}
          className="max-w-full max-h-[600px] object-contain"
        />
      </div>
    );
  }

  // For other file types, show a preview card
  const getFileIcon = () => {
    if (fileType?.includes('word') || fileType?.includes('document')) {
      return <FileText className="h-16 w-16 text-blue-500" />;
    }
    if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) {
      return <FileText className="h-16 w-16 text-green-500" />;
    }
    if (fileType?.includes('powerpoint') || fileType?.includes('presentation')) {
      return <FileText className="h-16 w-16 text-orange-500" />;
    }
    return <File className="h-16 w-16 text-muted-foreground" />;
  };

  return (
    <div className="w-full h-[600px] border rounded-lg flex flex-col items-center justify-center bg-muted/50 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        {getFileIcon()}
        <div>
          <h3 className="font-semibold text-lg mb-1">{fileName}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Preview not available for this file type
          </p>
        </div>
        <Link href={fileUrl} target="_blank" download>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download to View
          </Button>
        </Link>
      </div>
    </div>
  );
}
