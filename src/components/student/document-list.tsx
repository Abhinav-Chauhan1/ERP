"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  FileText, 
  File, 
  FileType, 
  FileImage, 
  FileSpreadsheet, 
  FileCode,
  Download, 
  Trash2, 
  User,
  Search,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { deleteDocument } from "@/lib/actions/student-document-actions";

interface DocumentType {
  id: string;
  name: string;
}

interface User {
  firstName: string;
  lastName: string;
}

interface Document {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  documentType: DocumentType | null;
  tags: string | null;
  createdAt: Date;
  user?: User;
}

interface DocumentListProps {
  documents: Document[];
  emptyMessage?: string;
  allowDownload?: boolean;
  allowDelete?: boolean;
  showUploader?: boolean;
}

export function DocumentList({ 
  documents, 
  emptyMessage = "No documents found", 
  allowDownload = true,
  allowDelete = false,
  showUploader = false
}: DocumentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (doc.tags && doc.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (doc.documentType && doc.documentType.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Get icon based on file type
  const getFileIcon = (fileType: string | null, fileName: string) => {
    if (!fileType) {
      if (fileName.endsWith('.pdf')) return <FileType className="h-6 w-6 text-red-500" />;
      if (/\.(jpg|jpeg|png|gif)$/i.test(fileName)) return <FileImage className="h-6 w-6 text-blue-500" />;
      if (/\.(xlsx|xls|csv)$/i.test(fileName)) return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
      if (/\.(html|css|js|json)$/i.test(fileName)) return <FileCode className="h-6 w-6 text-yellow-500" />;
      return <FileText className="h-6 w-6 text-gray-500" />;
    }
    
    if (fileType.includes('pdf')) return <FileType className="h-6 w-6 text-red-500" />;
    if (fileType.includes('image')) return <FileImage className="h-6 w-6 text-blue-500" />;
    if (fileType.includes('sheet') || fileType.includes('csv') || fileType.includes('excel')) 
      return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
    if (fileType.includes('html') || fileType.includes('javascript') || fileType.includes('css')) 
      return <FileCode className="h-6 w-6 text-yellow-500" />;
    
    return <FileText className="h-6 w-6 text-gray-500" />;
  };
  
  // Format file size
  const formatFileSize = (size: number | null) => {
    if (!size) return "Unknown";
    
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  };
  
  // Handle document deletion
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const result = await deleteDocument(id);
      if (result.success) {
        toast.success(result.message);
        // The page will be revalidated by the server action
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          className="pl-9"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {filteredDocuments.length > 0 ? (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => (
            <div 
              key={doc.id} 
              className="flex flex-col sm:flex-row sm:items-center gap-4 border rounded-lg p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex-shrink-0">
                {getFileIcon(doc.fileType, doc.fileName)}
              </div>
              
              <div className="flex-grow min-w-0">
                <h3 className="font-medium truncate">{doc.title}</h3>
                {doc.description && (
                  <p className="text-sm text-gray-500 line-clamp-1">{doc.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {doc.documentType && (
                    <Badge variant="outline" className="text-xs">
                      {doc.documentType.name}
                    </Badge>
                  )}
                  
                  {doc.tags && doc.tags.split(',').map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs bg-gray-100"
                    >
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                  <span>Added: {format(new Date(doc.createdAt), "MMM d, yyyy")}</span>
                  {doc.fileSize && <span>Size: {formatFileSize(doc.fileSize)}</span>}
                  {showUploader && doc.user && (
                    <span className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {doc.user.firstName} {doc.user.lastName}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 self-end sm:self-center mt-2 sm:mt-0">
                {allowDownload && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                    asChild
                  >
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      <span className="sm:hidden md:inline">Download</span>
                    </a>
                  </Button>
                )}
                
                {allowDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sm:hidden md:inline">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the document "{doc.title}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          disabled={isDeleting}
                          onClick={() => handleDelete(doc.id)}
                          className={cn(
                            "bg-red-600 hover:bg-red-700",
                            isDeleting && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <AlertTriangle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium mb-1">No documents found</h3>
          <p className="text-gray-500">
            {emptyMessage}
          </p>
        </div>
      )}
    </div>
  );
}
