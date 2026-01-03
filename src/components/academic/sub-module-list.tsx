"use client";

import { useState, useCallback, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import {
  GripVertical,
  Edit,
  Trash2,
  Plus,
  FileText,
  Loader2,
  Check,
  X,
  MoveHorizontal,
  Upload,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SubModuleFormDialog } from "./sub-module-form-dialog";
import { SubModuleListSkeleton } from "./sub-module-list-skeleton";
import { DocumentUploadDialog } from "./document-upload-dialog";
import {
  deleteSubModule,
  reorderSubModules,
  updateSubModule,
  moveSubModule,
} from "@/lib/actions/subModuleActions";
import { deleteDocument } from "@/lib/actions/syllabusDocumentActions";
import { useOptimisticReorder } from "@/hooks/use-optimistic-reorder";
import toast from "react-hot-toast";

const ITEM_TYPE = "SUB_MODULE";

interface SubModule {
  id: string;
  title: string;
  description: string | null;
  order: number;
  moduleId: string;
  documents?: any[];
  progress?: any[];
}

interface SubModuleListProps {
  subModules: SubModule[];
  moduleId: string;
  onRefresh: () => Promise<void>;
  allowCrossModuleDrag?: boolean;
}

interface DraggableSubModuleProps {
  subModule: SubModule;
  index: number;
  moduleId: string;
  moveSubModule: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (subModule: SubModule) => void;
  onDelete: (subModuleId: string) => void;
  onInlineEdit: (subModuleId: string) => void;
  isInlineEditing: boolean;
  onSaveInlineEdit: (subModuleId: string, title: string, description: string) => void;
  onCancelInlineEdit: () => void;
  onMoveToModule?: (subModuleId: string, targetModuleId: string, order: number) => void;
  allowCrossModuleDrag?: boolean;
  onUploadDocument: (subModuleId: string) => void;
  onRefresh: () => Promise<void>;
}

function DraggableSubModule({
  subModule,
  index,
  moduleId,
  moveSubModule,
  onEdit,
  onDelete,
  onInlineEdit,
  isInlineEditing,
  onSaveInlineEdit,
  onCancelInlineEdit,
  onMoveToModule,
  allowCrossModuleDrag = false,
  onUploadDocument,
  onRefresh,
}: DraggableSubModuleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [editTitle, setEditTitle] = useState(subModule.title);
  const [editDescription, setEditDescription] = useState(subModule.description || "");

  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { index, id: subModule.id, moduleId, subModule },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isInlineEditing,
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: { index: number; id: string; moduleId: string; subModule: SubModule }, monitor) => {
      // Handle cross-module drop
      if (item.moduleId !== moduleId && allowCrossModuleDrag && onMoveToModule) {
        // Calculate the order based on the drop position
        const newOrder = index + 1;
        onMoveToModule(item.id, moduleId, newOrder);
        return;
      }
    },
    hover: (item: { index: number; id: string; moduleId: string }, monitor) => {
      if (!ref.current) {
        return;
      }

      // Only allow reordering within the same module during hover
      if (item.moduleId !== moduleId) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveSubModule(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    canDrop: (item) => {
      // Allow drop if it's the same module or cross-module drag is enabled
      return item.moduleId === moduleId || allowCrossModuleDrag;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  drag(drop(ref));

  const handleSave = () => {
    onSaveInlineEdit(subModule.id, editTitle, editDescription);
  };

  const handleCancel = () => {
    setEditTitle(subModule.title);
    setEditDescription(subModule.description || "");
    onCancelInlineEdit();
  };

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-200",
        isDragging && "opacity-50",
        isOver && canDrop && "border-t-2 border-primary",
        isOver && !canDrop && "border-t-2 border-red-500"
      )}
      role="article"
      aria-label={`Sub-module ${index + 1}: ${subModule.title}`}
    >
      <div className="border rounded-md bg-accent/50 mb-2">
        <div className="flex items-center justify-between p-2 md:p-3">
          {isInlineEditing ? (
            <div className="flex-1 space-y-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Sub-module title"
                className="font-medium"
                aria-label="Sub-module title"
              />
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Sub-module description (optional)"
                rows={2}
                className="text-sm"
                aria-label="Sub-module description"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} aria-label="Save changes">
                  <Check className="h-4 w-4 mr-1" aria-hidden="true" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} aria-label="Cancel editing">
                  <X className="h-4 w-4 mr-1" aria-hidden="true" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {!isInlineEditing && (
                  <div
                    ref={(node) => { preview(node); }}
                    className="cursor-move hover:bg-accent rounded p-1 touch-none flex-shrink-0"
                    title="Drag to reorder"
                    role="button"
                    aria-label={`Drag to reorder sub-module ${subModule.title}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        // Keyboard reordering could be implemented here
                      }
                    }}
                  >
                    <GripVertical className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                )}
                <span className="text-xs md:text-sm font-medium text-muted-foreground flex-shrink-0" aria-label={`Position ${index + 1}`}>
                  {index + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs md:text-sm font-medium truncate">{subModule.title}</h5>
                  {subModule.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {subModule.description}
                    </p>
                  )}
                  {subModule.documents && subModule.documents.length > 0 && (
                    <Badge variant="outline" className="text-xs mt-1">
                      <span className="sr-only">Number of documents:</span>
                      {subModule.documents.length} Document{subModule.documents.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUploadDocument(subModule.id);
                  }}
                  title="Upload document"
                  aria-label={`Upload document to sub-module ${subModule.title}`}
                >
                  <Upload className="h-3 w-3 md:h-3.5 md:w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInlineEdit(subModule.id);
                  }}
                  title="Quick edit"
                  aria-label={`Edit sub-module ${subModule.title}`}
                >
                  <Edit className="h-3 w-3 md:h-3.5 md:w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(subModule.id);
                  }}
                  title="Delete"
                  aria-label={`Delete sub-module ${subModule.title}`}
                >
                  <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Documents section */}
        {!isInlineEditing && subModule.documents && subModule.documents.length > 0 && (
          <div className="px-2 md:px-3 pb-2 md:pb-3 pt-0">
            <div className="space-y-1">
              {subModule.documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2 border rounded-md bg-background/50 hover:bg-background transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{doc.title}</p>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(doc.fileUrl, '_blank');
                      }}
                      title="View document"
                      aria-label={`View ${doc.title}`}
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
                          const result = await deleteDocument(doc.id);
                          if (result.success) {
                            toast.success("Document deleted successfully");
                            await onRefresh();
                          } else {
                            toast.error(result.error || "Failed to delete document");
                          }
                        }
                      }}
                      title="Delete document"
                      aria-label={`Delete ${doc.title}`}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SubModuleList({
  subModules: initialSubModules,
  moduleId,
  onRefresh,
  allowCrossModuleDrag = false,
}: SubModuleListProps) {
  const [editingSubModule, setEditingSubModule] = useState<SubModule | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedSubModuleForUpload, setSelectedSubModuleForUpload] = useState<string | null>(null);

  // Use optimistic reordering hook
  const {
    items: subModules,
    moveItem: moveSubModuleOptimistic,
    saveOrder: handleSaveOrder,
    isReordering: isSaving,
    hasChanges: hasOrderChanged,
  } = useOptimisticReorder({
    items: initialSubModules,
    onReorder: async (reorderedSubModules) => {
      // Update order based on new positions
      const subModuleOrders = reorderedSubModules.map((subModule, index) => ({
        id: subModule.id,
        order: index + 1,
      }));

      const result = await reorderSubModules({
        moduleId,
        subModuleOrders,
      });

      if (result.success) {
        await onRefresh();
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Sub-module order saved successfully");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const handleMoveToModule = async (
    subModuleId: string,
    targetModuleId: string,
    order: number
  ) => {
    setIsLoading(true);
    try {
      const result = await moveSubModule({
        subModuleId,
        targetModuleId,
        order,
      });

      if (result.success) {
        toast.success("Sub-module moved successfully");
        await onRefresh();
      } else {
        toast.error(result.error || "Failed to move sub-module");
      }
    } catch (error) {
      console.error("Error moving sub-module:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInlineEdit = async (
    subModuleId: string,
    title: string,
    description: string
  ) => {
    const subModule = subModules.find((sm) => sm.id === subModuleId);
    if (!subModule) return;

    setIsLoading(true);
    try {
      const result = await updateSubModule({
        id: subModuleId,
        title,
        description,
        order: subModule.order,
        moduleId: subModule.moduleId,
      });

      if (result.success) {
        toast.success("Sub-module updated successfully");
        setInlineEditingId(null);
        await onRefresh();
      } else {
        toast.error(result.error || "Failed to update sub-module");
      }
    } catch (error) {
      console.error("Error updating sub-module:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (subModule: SubModule) => {
    setEditingSubModule(subModule);
    setIsFormOpen(true);
  };

  const handleInlineEdit = (subModuleId: string) => {
    setInlineEditingId(subModuleId);
  };

  const handleCancelInlineEdit = () => {
    setInlineEditingId(null);
  };

  const handleDelete = async (subModuleId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this sub-module? This will also delete all associated documents."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteSubModule(subModuleId);

      if (result.success) {
        toast.success("Sub-module deleted successfully");
        await onRefresh();
      } else {
        toast.error(result.error || "Failed to delete sub-module");
      }
    } catch (error) {
      console.error("Error deleting sub-module:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddNew = () => {
    setEditingSubModule(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSubModule(null);
  };

  const handleFormSuccess = async () => {
    setIsFormOpen(false);
    setEditingSubModule(null);
    setIsLoading(true);
    await onRefresh();
    setIsLoading(false);
  };

  const hasOrderChangedCheck = () => {
    return hasOrderChanged;
  };

  const handleUploadDocument = (subModuleId: string) => {
    setSelectedSubModuleForUpload(subModuleId);
    setUploadDialogOpen(true);
  };

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
    setSelectedSubModuleForUpload(null);
  };

  const handleUploadSuccess = async () => {
    await onRefresh();
  };

  // Drop zone component for empty lists
  const EmptyDropZone = () => {
    const [{ isOver, canDrop }, drop] = useDrop({
      accept: ITEM_TYPE,
      drop: (item: { id: string; moduleId: string }) => {
        if (item.moduleId !== moduleId && allowCrossModuleDrag) {
          handleMoveToModule(item.id, moduleId, 1);
        }
      },
      canDrop: (item) => {
        return item.moduleId !== moduleId && allowCrossModuleDrag;
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    });

    return (
      <div
        ref={(node) => { drop(node); }}
        className={cn(
          "text-center py-4 text-muted-foreground border rounded-md bg-accent/30 transition-all",
          isOver && canDrop && "border-primary border-2 bg-primary/10",
          canDrop && !isOver && "border-dashed"
        )}
      >
        {isOver && canDrop ? (
          <div className="flex items-center justify-center gap-2">
            <MoveHorizontal className="h-4 w-4 text-primary" />
            <p className="text-sm text-primary font-medium">Drop here to move sub-module</p>
          </div>
        ) : (
          <>
            <p className="text-sm">No sub-modules added yet</p>
            {allowCrossModuleDrag && (
              <p className="text-xs mt-1 text-muted-foreground">
                Drag sub-modules from other modules here
              </p>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="mt-2"
              onClick={handleAddNew}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add First Sub-module
            </Button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3" role="region" aria-label="Sub-modules">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium">Sub-modules</h4>
          {isLoading && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-label="Loading" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {hasOrderChangedCheck() && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveOrder}
              disabled={isSaving}
              aria-label="Save sub-module order"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                "Save Order"
              )}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleAddNew} aria-label="Add new sub-module">
            <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            <span className="hidden sm:inline">Add Sub-module</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {isLoading && subModules.length === 0 ? (
        <SubModuleListSkeleton count={2} />
      ) : subModules.length > 0 ? (
        <div className="space-y-2" role="list" aria-label="Sub-modules list">
          {subModules.map((subModule, index) => (
            <DraggableSubModule
              key={subModule.id}
              subModule={subModule}
              index={index}
              moduleId={moduleId}
              moveSubModule={moveSubModuleOptimistic}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onInlineEdit={handleInlineEdit}
              isInlineEditing={inlineEditingId === subModule.id}
              onSaveInlineEdit={handleSaveInlineEdit}
              onCancelInlineEdit={handleCancelInlineEdit}
              onMoveToModule={handleMoveToModule}
              allowCrossModuleDrag={allowCrossModuleDrag}
              onUploadDocument={handleUploadDocument}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      ) : (
        <EmptyDropZone />
      )}

      <SubModuleFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        moduleId={moduleId}
        subModule={editingSubModule}
      />

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onClose={handleUploadDialogClose}
        onSuccess={handleUploadSuccess}
        subModuleId={selectedSubModuleForUpload || undefined}
      />
    </div>
  );
}
