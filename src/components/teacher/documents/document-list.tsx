"use client";

import { useState } from "react";
import { DocumentCard } from "./document-card";
import { FileText } from "lucide-react";

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

interface DocumentListProps {
  documents: Document[];
  userId: string;
}

export function DocumentList({ documents, userId }: DocumentListProps) {
  const [localDocuments, setLocalDocuments] = useState(documents);

  const handleDelete = (documentId: string) => {
    setLocalDocuments(localDocuments.filter(doc => doc.id !== documentId));
  };

  if (localDocuments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" role="status" aria-label="No documents available">
        <div className="rounded-full bg-muted p-3 mb-4">
          <FileText className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No documents found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your first document to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Document list">
      {localDocuments.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
