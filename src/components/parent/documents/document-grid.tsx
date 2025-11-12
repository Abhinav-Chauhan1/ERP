"use client";

import { FileX } from "lucide-react";
import { DocumentCard } from "./document-card";

interface Document {
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
}

interface DocumentGridProps {
  documents: Document[];
  onPreview: (documentId: string) => void;
  onDownload: (documentId: string) => void;
  viewMode?: "grid" | "list";
}

export function DocumentGrid({ 
  documents, 
  onPreview, 
  onDownload,
  viewMode = "grid" 
}: DocumentGridProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileX className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No documents found
        </h3>
        <p className="text-sm text-gray-500">
          There are no documents available for this student yet.
        </p>
      </div>
    );
  }

  return (
    <div className={
      viewMode === "grid" 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        : "space-y-3"
    }>
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onPreview={onPreview}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
}
