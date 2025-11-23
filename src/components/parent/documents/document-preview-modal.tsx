"use client";

import { useState, useEffect } from "react";
import { X, Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { previewDocument } from "@/lib/actions/parent-document-actions";
import { toast } from "react-hot-toast";

interface DocumentPreviewModalProps {
  documentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (documentId: string) => void;
}

export function DocumentPreviewModal({
  documentId,
  isOpen,
  onClose,
  onDownload,
}: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState<any>(null);

  useEffect(() => {
    if (documentId && isOpen) {
      loadDocument();
    }
  }, [documentId, isOpen]);

  const loadDocument = async () => {
    if (!documentId) return;

    setLoading(true);
    try {
      const result = await previewDocument(documentId);
      if (result.success && result.data) {
        setDocument(result.data);
      } else {
        toast.error(result.message || "Failed to load document");
        onClose();
      }
    } catch (error) {
      toast.error("Failed to load document");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (documentId) {
      onDownload(documentId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg">
                {document?.title || "Document Preview"}
              </DialogTitle>
              {document && (
                <div className="flex items-center gap-2 mt-2">
                  {document.documentType && (
                    <Badge variant="outline" className="text-xs">
                      {document.documentType.name}
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500">
                    {format(new Date(document.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : document ? (
            <div className="h-full">
              {document.isPreviewable ? (
                <>
                  {document.fileType?.startsWith('image/') ? (
                    <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                      <img
                        src={document.fileUrl}
                        alt={document.title}
                        width={800}
                        height={600}
                        loading="lazy"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : document.fileType === 'application/pdf' ? (
                    <iframe
                      src={document.fileUrl}
                      className="w-full h-full border-0 rounded-lg"
                      title={document.title}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Preview not available</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-gray-500 mb-4">
                    Preview not available for this file type
                  </p>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download to view
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
