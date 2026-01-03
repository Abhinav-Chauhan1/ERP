"use client";

/**
 * Document Management Component
 * Main component for managing documents in modules/sub-modules
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 9.1, 9.2, 9.3, 9.4
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DocumentList } from "./document-list";
import { DocumentMetadataForm } from "./document-metadata-form";
import { BulkDocumentUpload } from "./bulk-document-upload";
import {
  getDocumentsByParent,
  deleteDocument,
} from "@/lib/actions/syllabusDocumentActions";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Document {
  id: string;
  title: string;
  description?: string | null;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  order: number;
  createdAt: Date;
}

interface DocumentManagementProps {
  parentId: string;
  parentType: "module" | "subModule";
  uploadedBy: string;
  showActions?: boolean;
  enableReordering?: boolean;
  className?: string;
}

export function DocumentManagement({
  parentId,
  parentType,
  uploadedBy,
  showActions = true,
  enableReordering = true,
  className,
}: DocumentManagementProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDocumentsByParent(parentId, parentType);
      if (result.success && result.data) {
        setDocuments(result.data);
      } else {
        throw new Error(result.error || "Failed to load documents");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [parentId, parentType]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleEdit = (document: Document) => {
    setSelectedDocument(document);
    setShowMetadataForm(true);
  };

  const handleDelete = async (documentId: string) => {
    try {
      const result = await deleteDocument(documentId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Document deleted successfully.",
        });
        await loadDocuments();
        router.refresh();
      } else {
        throw new Error(result.error || "Failed to delete document");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleView = (fileUrl: string) => {
    window.open(fileUrl, "_blank");
  };

  const handleMetadataFormSuccess = async () => {
    await loadDocuments();
    router.refresh();
  };

  const handleBulkUploadSuccess = async () => {
    await loadDocuments();
    router.refresh();
  };

  const handleReorder = async () => {
    await loadDocuments();
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Documents</h3>
          <Button onClick={() => setShowBulkUpload(true)} size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </Button>
        </div>
      )}

      {/* Document List */}
      <DocumentList
        documents={documents}
        parentId={parentId}
        parentType={parentType}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onReorder={handleReorder}
        showActions={showActions}
        enableReordering={enableReordering}
      />

      {/* Metadata Form Dialog */}
      {selectedDocument && (
        <DocumentMetadataForm
          document={selectedDocument}
          open={showMetadataForm}
          onOpenChange={setShowMetadataForm}
          onSuccess={handleMetadataFormSuccess}
        />
      )}

      {/* Bulk Upload Dialog */}
      <BulkDocumentUpload
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        moduleId={parentType === "module" ? parentId : undefined}
        subModuleId={parentType === "subModule" ? parentId : undefined}
        uploadedBy={uploadedBy}
        onSuccess={handleBulkUploadSuccess}
      />
    </div>
  );
}
