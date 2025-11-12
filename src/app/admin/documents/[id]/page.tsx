"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  Download, 
  FileText, 
  Clock, 
  User as UserIcon, 
  Tag, 
  Lock, 
  Globe, 
  Trash2, 
  Edit, 
  FolderOpen, 
  Share2,
  FileBox,
  FileImage,
  FileSpreadsheet,
  FileText as FileTextIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getDocument, deleteDocument } from "@/lib/actions/documentActions";

// Utility function to format dates
const formatDate = (date: Date | string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Utility function to format file size
const formatFileSize = (bytes?: number) => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
};

// Get file icon based on MIME type
const getFileIcon = (fileType?: string, size = 24) => {
  if (!fileType) return <FileBox size={size} />;
  
  if (fileType.startsWith('image/')) return <FileImage size={size} />;
  else if (fileType === 'application/pdf') return <FileText size={size} />;
  else if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileSpreadsheet size={size} />;
  else if (fileType.includes('document') || fileType.includes('word')) return <FileTextIcon size={size} />;
  
  return <FileBox size={size} />;
};

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentId, setDocumentId] = useState<string>("");

  // Unwrap params
  useEffect(() => {
    params.then(p => setDocumentId(p.id));
  }, [params]);

  // Fetch document data
  useEffect(() => {
    if (!documentId) return;
    
    const fetchDocument = async () => {
      setLoading(true);
      const result = await getDocument(documentId);
      
      if (result.success && result.data) {
        setDocument(result.data);
      } else {
        toast.error(result.error || "Failed to fetch document");
        router.push("/admin/documents");
      }
      setLoading(false);
    };

    fetchDocument();
  }, [documentId, router]);

  // Handle document deletion
  const handleDeleteDocument = async () => {
    const result = await deleteDocument(documentId);
    
    if (result.success) {
      toast.success("Document deleted successfully");
      router.push("/admin/documents");
    } else {
      toast.error(result.error || "Failed to delete document");
      setDeleteDialogOpen(false);
    }
  };

  // Handle sharing document
  const handleShareDocument = () => {
    try {
      if (navigator.share) {
        navigator.share({
          title: document?.title,
          text: document?.description,
          url: document?.fileUrl,
        });
      } else {
        navigator.clipboard.writeText(document?.fileUrl);
        toast.success("Document link copied to clipboard");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold mb-2">Document Not Found</h2>
        <p className="text-gray-500 mb-4">The document you're looking for doesn't exist or has been removed.</p>
        <Link href="/admin/documents">
          <Button>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Documents
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/documents">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{document.title}</h1>
          <Badge className={`${document.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {document.isPublic ? 'Public' : 'Private'}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShareDocument}>
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Link href={document.fileUrl} download>
            <Button>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
            <CardDescription>
              {document.fileName} ({formatFileSize(document.fileSize)})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-gray-50 p-8 flex items-center justify-center min-h-[400px]">
              {document.fileType?.startsWith('image/') ? (
                <img 
                  src={document.fileUrl} 
                  alt={document.title} 
                  className="max-w-full max-h-[400px] object-contain" 
                />
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center p-6 bg-white rounded-full shadow-sm mb-4">
                    {getFileIcon(document.fileType, 48)}
                  </div>
                  <p className="text-gray-500">This file cannot be previewed directly.</p>
                  <Link href={document.fileUrl} target="_blank">
                    <Button variant="outline" className="mt-4">
                      Open File
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p className="text-sm">
                {document.description || "No description provided"}
              </p>
            </div>
            
            {/* Uploaded By */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                <UserIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Uploaded By</h3>
                <p className="text-sm text-gray-600">
                  {document.user.firstName} {document.user.lastName}
                  <span className="block text-xs text-gray-500">{document.user.email}</span>
                </p>
              </div>
            </div>
            
            {/* Upload Date */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-green-50 text-green-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Upload Date</h3>
                <p className="text-sm text-gray-600">{formatDate(document.createdAt)}</p>
              </div>
            </div>
            
            {/* Document Type */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-purple-50 text-purple-600">
                <FolderOpen className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Document Type</h3>
                <p className="text-sm text-gray-600">
                  {document.documentType ? document.documentType.name : "Uncategorized"}
                </p>
              </div>
            </div>
            
            {/* Tags */}
            {document.tags && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-amber-50 text-amber-600">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Tags</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {document.tags.split(',').map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Visibility */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-gray-50 text-gray-600">
                {document.isPublic ? (
                  <Globe className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium">Visibility</h3>
                <p className="text-sm text-gray-600">
                  {document.isPublic 
                    ? "Public - Accessible to all users" 
                    : "Private - Restricted access"}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t flex justify-between">
            <Button 
              variant="outline" 
              className="text-red-600" 
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Link href={`/admin/documents/edit/${document.id}`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border rounded-md p-4">
              <h3 className="font-medium">{document.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{document.fileName}</p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteDocument}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
