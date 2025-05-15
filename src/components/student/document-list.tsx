"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { File, FileText, Download, Image, FileSpreadsheet, Search, Trash2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

interface Document {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  tags: string | null;
  createdAt: Date;
  documentType: {
    id: string;
    name: string;
  } | null;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface DocumentListProps {
  documents: Document[];
  emptyMessage: string;
  allowDownload: boolean;
  allowDelete: boolean;
  showUploader?: boolean;
}

export function DocumentList({ documents, emptyMessage, allowDownload, allowDelete, showUploader = false }: DocumentListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredDocuments = documents.filter((doc) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(searchLower) ||
      (doc.description && doc.description.toLowerCase().includes(searchLower)) ||
      doc.fileName.toLowerCase().includes(searchLower) ||
      (doc.documentType && doc.documentType.name.toLowerCase().includes(searchLower)) ||
      (doc.tags && doc.tags.toLowerCase().includes(searchLower))
    );
  });

  const getFileIcon = (fileType: string | null, fileName: string) => {
    if (!fileType) {
      // Try to extract from filename if fileType is not available
      const extension = fileName.split('.').pop()?.toLowerCase();
      fileType = extension || 'unknown';
    }
    
    if (fileType.includes('pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else if (
      fileType.includes('image') || 
      ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)
    ) {
      return <Image className="h-6 w-6 text-purple-500" />;
    } else if (
      fileType.includes('sheet') || 
      fileType.includes('excel') || 
      ['xls', 'xlsx', 'csv'].includes(fileType)
    ) {
      return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
    } else {
      return <FileText className="h-6 w-6 text-blue-500" />;
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    // Create temporary link for download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/documents/${documentToDelete}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete document");
      }
      
      toast.success("Document deleted successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Error deleting document");
    } finally {
      setIsDeleting(false);
      setDocumentToDelete(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="h-12 w-12 mx-auto text-gray-400" />
        <p className="mt-4 text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search documents..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-10">
          <AlertCircle className="h-10 w-10 mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">No documents found matching your search</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((document) => (
            <div 
              key={document.id}
              className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                {getFileIcon(document.fileType, document.fileName)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-medium text-gray-900 truncate">{document.title}</h4>
                  
                  {document.documentType && (
                    <Badge variant="outline" className="whitespace-nowrap">
                      {document.documentType.name}
                    </Badge>
                  )}
                </div>
                
                {document.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                    {document.description}
                  </p>
                )}
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 text-xs text-gray-500">
                  <span className="flex items-center">
                    <File className="h-3.5 w-3.5 mr-1" />
                    {document.fileName}
                  </span>
                  
                  <span className="hidden sm:block">•</span>
                  
                  <span>
                    Uploaded: {format(new Date(document.createdAt), "MMM d, yyyy")}
                  </span>
                  
                  {showUploader && document.user && (
                    <>
                      <span className="hidden sm:block">•</span>
                      <span>
                        By: {document.user.firstName} {document.user.lastName}
                      </span>
                    </>
                  )}
                </div>
                
                {document.tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {document.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-2 sm:mt-0">
                {allowDownload && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleDownload(document.fileUrl, document.fileName)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
                
                {allowDelete && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDocumentToDelete(document.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <AlertDialog open={!!documentToDelete} onOpenChange={(open: boolean) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The document will be permanently deleted from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
