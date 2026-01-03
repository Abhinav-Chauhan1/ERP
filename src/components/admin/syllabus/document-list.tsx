"use client";

/**
 * Document List Component
 * Displays a list of documents with drag-and-drop reordering
 * Requirements: 3.3, 4.5, 5.3, 6.3
 */

import { useState, useCallback } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DocumentCard } from "./document-card";
import { reorderDocuments } from "@/lib/actions/syllabusDocumentActions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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

interface DocumentListProps {
  documents: Document[];
  parentId: string;
  parentType: "module" | "subModule";
  onEdit?: (document: Document) => void;
  onDelete?: (documentId: string) => Promise<void>;
  onView?: (fileUrl: string) => void;
  onReorder?: () => void;
  showActions?: boolean;
  enableReordering?: boolean;
  className?: string;
}

interface DraggableDocumentProps {
  document: Document;
  index: number;
  moveDocument: (dragIndex: number, hoverIndex: number) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (documentId: string) => Promise<void>;
  onView?: (fileUrl: string) => void;
  showActions?: boolean;
}

const DRAG_TYPE = "DOCUMENT";

function DraggableDocument({
  document,
  index,
  moveDocument,
  onEdit,
  onDelete,
  onView,
  showActions,
}: DraggableDocumentProps) {
  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { index, id: document.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: DRAG_TYPE,
    hover: (item: { index: number; id: string }) => {
      if (item.index !== index) {
        moveDocument(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node: HTMLDivElement | null) => { drag(drop(node)); }}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="cursor-move"
    >
      <DocumentCard
        document={document}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        showActions={showActions}
        draggable
      />
    </div>
  );
}

export function DocumentList({
  documents: initialDocuments,
  parentId,
  parentType,
  onEdit,
  onDelete,
  onView,
  onReorder,
  showActions = true,
  enableReordering = true,
  className,
}: DocumentListProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const moveDocument = useCallback((dragIndex: number, hoverIndex: number) => {
    setDocuments((prevDocuments) => {
      const newDocuments = [...prevDocuments];
      const [removed] = newDocuments.splice(dragIndex, 1);
      newDocuments.splice(hoverIndex, 0, removed);
      return newDocuments;
    });
  }, []);

  const saveOrder = useCallback(async () => {
    setIsSaving(true);
    try {
      // Create order array with updated positions
      const documentOrders = documents.map((doc, index) => ({
        id: doc.id,
        order: index,
      }));

      const result = await reorderDocuments({
        parentId,
        parentType,
        documentOrders,
      });

      if (result.success) {
        toast({
          title: "Order saved",
          description: "Document order has been updated successfully.",
        });
        if (onReorder) {
          onReorder();
        }
      } else {
        throw new Error(result.error || "Failed to save order");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save order",
        variant: "destructive",
      });
      // Revert to initial order
      setDocuments(initialDocuments);
    } finally {
      setIsSaving(false);
    }
  }, [documents, parentId, parentType, initialDocuments, onReorder, toast]);

  // Check if order has changed
  const hasOrderChanged = documents.some(
    (doc, index) => doc.id !== initialDocuments[index]?.id
  );

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No documents uploaded yet.</p>
      </div>
    );
  }

  if (!enableReordering) {
    return (
      <div className={className}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              showActions={showActions}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={className}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((document, index) => (
            <DraggableDocument
              key={document.id}
              document={document}
              index={index}
              moveDocument={moveDocument}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              showActions={showActions}
            />
          ))}
        </div>

        {hasOrderChanged && (
          <div className="mt-4 flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Document order has changed
            </p>
            <button
              onClick={saveOrder}
              disabled={isSaving}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="inline h-4 w-4 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                "Save Order"
              )}
            </button>
          </div>
        )}
      </div>
    </DndProvider>
  );
}
