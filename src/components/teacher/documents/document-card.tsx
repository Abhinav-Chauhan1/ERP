"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Download, Trash2, Eye, File, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "react-hot-toast";

interface Document {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  category: string | null;
  createdAt: Date;
  documentType: {
    id: string;
    name: string;
  } | null;
}

interface DocumentCardProps {
  document: Document;
  onDelete: (documentId: string) => void;
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return <File className="h-8 w-8" />;
  
  if (fileType.startsWith('image/')) return <ImageIcon className="h-8 w-8" />;
  if (fileType === 'application/pdf') return <FileText className="h-8 w-8" />;
  
  return <File className="h-8 w-8" />;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getCategoryLabel(category: string | null): string {
  if (!category) return "Other";
  
  const labels: Record<string, string> = {
    CERTIFICATE: "Certificate",
    ID_PROOF: "ID Proof",
    TEACHING_MATERIAL: "Teaching Material",
    LESSON_PLAN: "Lesson Plan",
    CURRICULUM: "Curriculum",
    POLICY: "Policy",
    OTHER: "Other",
  };
  
  return labels[category] || category;
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/teacher/documents/${document.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      toast.success('Document deleted successfully');
      onDelete(document.id);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {getFileIcon(document.fileType)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{document.title}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {document.fileName}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-3">
        {document.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {document.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            {getCategoryLabel(document.category)}
          </Badge>
          {document.documentType && (
            <Badge variant="outline" className="text-xs">
              {document.documentType.name}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatFileSize(document.fileSize)}</span>
          <span>{formatDate(document.createdAt)}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 border-t flex gap-2">
        <Link href={`/teacher/documents/${document.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full" aria-label={`View ${document.title}`}>
            <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
            View
          </Button>
        </Link>
        
        <Link href={document.fileUrl} target="_blank" download>
          <Button variant="outline" size="sm" aria-label={`Download ${document.title}`}>
            <Download className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={isDeleting}
              aria-label={`Delete ${document.title}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{document.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
