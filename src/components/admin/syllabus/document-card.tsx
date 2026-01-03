"use client";

/**
 * Document Card Component
 * Displays a document with metadata, preview, and actions
 * Requirements: 3.3, 4.3, 5.3, 6.3
 */

import { useState } from "react";
import {
  FileText,
  FileImage,
  FileVideo,
  File,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  GripVertical,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DocumentCardProps {
  document: {
    id: string;
    title: string;
    description?: string | null;
    filename: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    order: number;
    createdAt: Date;
  };
  onEdit?: (document: any) => void;
  onDelete?: (documentId: string) => void;
  onView?: (fileUrl: string) => void;
  showActions?: boolean;
  draggable?: boolean;
  className?: string;
}

export function DocumentCard({
  document,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  draggable = false,
  className,
}: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <FileImage className="h-5 w-5" />;
    }
    if (fileType.startsWith("video/")) {
      return <FileVideo className="h-5 w-5" />;
    }
    if (
      fileType.includes("pdf") ||
      fileType.includes("word") ||
      fileType.includes("document")
    ) {
      return <FileText className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.includes("pdf")) return "PDF";
    if (fileType.includes("word") || fileType.includes("document")) return "DOC";
    if (fileType.includes("presentation") || fileType.includes("powerpoint"))
      return "PPT";
    if (fileType.startsWith("image/")) return "Image";
    if (fileType.startsWith("video/")) return "Video";
    return "File";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    window.open(document.fileUrl, "_blank");
  };

  const handleView = () => {
    if (onView) {
      onView(document.fileUrl);
    } else {
      window.open(document.fileUrl, "_blank");
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(document);
    }
  };

  const handleDelete = async () => {
    if (onDelete && confirm("Are you sure you want to delete this document?")) {
      setIsDeleting(true);
      try {
        await onDelete(document.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Card className={cn("group relative", className)}>
      {draggable && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <CardHeader className={cn("pb-3", draggable && "pl-10")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 mt-1 text-muted-foreground">
              {getFileIcon(document.fileType)}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{document.title}</CardTitle>
              {document.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {document.description}
                </CardDescription>
              )}
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  disabled={isDeleting}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleView}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                {onEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  </>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive"
                      disabled={isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isDeleting ? "Deleting..." : "Delete"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardFooter className="pt-0 pb-3 flex-wrap gap-2">
        <Badge variant="secondary" className="text-xs">
          {getFileTypeLabel(document.fileType)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatFileSize(document.fileSize)}
        </span>
        <span className="text-xs text-muted-foreground">•</span>
        <span className="text-xs text-muted-foreground truncate">
          {document.filename}
        </span>
      </CardFooter>
    </Card>
  );
}
