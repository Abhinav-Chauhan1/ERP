"use client";

import { format } from "date-fns";
import { Download, Eye, FileText, Image, FileIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DocumentCardProps {
  document: {
    id: string;
    title: string;
    description: string | null;
    fileName: string;
    fileType: string | null;
    fileSize: number | null;
    createdAt: Date;
    documentType: {
      id: string;
      name: string;
    } | null;
  };
  onPreview: (documentId: string) => void;
  onDownload: (documentId: string) => void;
}

export function DocumentCard({ document, onPreview, onDownload }: DocumentCardProps) {
  const getFileIcon = () => {
    if (!document.fileType) return <FileIcon className="h-8 w-8 text-gray-400" />;
    
    if (document.fileType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (document.fileType === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <FileIcon className="h-8 w-8 text-gray-400" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPreviewable = document.fileType && (
    document.fileType.startsWith('image/') || 
    document.fileType === 'application/pdf'
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* File Icon */}
          <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
            {getFileIcon()}
          </div>

          {/* Document Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate mb-1">
              {document.title}
            </h3>
            
            {document.description && (
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                {document.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-2">
              {document.documentType && (
                <Badge variant="outline" className="text-xs">
                  {document.documentType.name}
                </Badge>
              )}
              <span className="text-xs text-gray-500">
                {formatFileSize(document.fileSize)}
              </span>
            </div>

            <p className="text-xs text-gray-400">
              {format(new Date(document.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {isPreviewable && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onPreview(document.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            className={isPreviewable ? "flex-1" : "w-full"}
            onClick={() => onDownload(document.id)}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
