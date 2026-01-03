"use client";

import { useState, useCallback, useRef } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  GripVertical,
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Check,
  X,
  Download,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ModuleFormDialog } from "./module-form-dialog";
import { SubModuleList } from "./sub-module-list";
import { ModuleListSkeleton } from "./module-list-skeleton";
import { DocumentUploadDialog } from "./document-upload-dialog";
import { deleteModule, reorderModules, updateModule } from "@/lib/actions/moduleActions";
import { deleteDocument } from "@/lib/actions/syllabusDocumentActions";
import { useOptimisticReorder } from "@/hooks/use-optimistic-reorder";
import toast from "react-hot-toast";

const ITEM_TYPE = "MODULE";

interface Module {
  id: string;
  title: string;
  description: string | null;
  chapterNumber: number;
  order: number;
  syllabusId: string;
  subModules?: any[];
  documents?: any[];
}

interface ModuleListProps {
  modules: Module[];
  syllabusId: string;
  onRefresh: () => Promise<void>;
}

interface DraggableModuleProps {
  module: Module;
  index: number;
  moveModule: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (module: Module) => void;
  onDelete: (moduleId: string) => void;
  onInlineEdit: (moduleId: string) => void;
  isInlineEditing: boolean;
  onSaveInlineEdit: (moduleId: string, title: string, description: string) => void;
  onCancelInlineEdit: () => void;
  isExpanded: boolean;
  onUploadDocument: (moduleId: string) => void;
  onRefresh: () => Promise<void>;
}

function DraggableModule({
  module,
  index,
  moveModule,
  onEdit,
  onDelete,
  onInlineEdit,
  isInlineEditing,
  onSaveInlineEdit,
  onCancelInlineEdit,
  isExpanded,
  onUploadDocument,
  onRefresh,
}: DraggableModuleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [editTitle, setEditTitle] = useState(module.title);
  const [editDescription, setEditDescription] = useState(module.description || "");

  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { index, id: module.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isInlineEditing,
  });

  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (item: { index: number; id: string }, monitor) => {
      if (!ref.current) {
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

      moveModule(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  const handleSave = () => {
    onSaveInlineEdit(module.id, editTitle, editDescription);
  };

  const handleCancel = () => {
    setEditTitle(module.title);
    setEditDescription(module.description || "");
    onCancelInlineEdit();
  };

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-200",
        isDragging && "opacity-50",
        isOver && "border-t-2 border-primary"
      )}
      role="article"
      aria-label={`Module ${module.chapterNumber}: ${module.title}`}
    >
      <AccordionItem value={module.id} className="border rounded-md mb-3">
        <div className="flex items-center gap-2 px-3 py-3 md:px-4 md:py-3">
          {!isInlineEditing && (
            <div
              ref={(node) => { preview(node); }}
              className="cursor-move hover:bg-accent rounded p-1 touch-none"
              title="Drag to reorder"
              role="button"
              aria-label={`Drag to reorder module ${module.chapterNumber}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  // Keyboard reordering could be implemented here
                }
              }}
            >
              <GripVertical className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" aria-hidden="true" />
            </div>
          )}

          <div
            className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 text-primary font-medium text-xs md:text-sm flex-shrink-0"
            aria-label={`Chapter ${module.chapterNumber}`}
          >
            {module.chapterNumber}
          </div>

          {isInlineEditing ? (
            <div className="flex-1 space-y-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Module title"
                className="font-medium"
                aria-label="Module title"
              />
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Module description (optional)"
                rows={2}
                className="text-sm"
                aria-label="Module description"
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
              <AccordionTrigger className="flex-1 hover:no-underline py-0" aria-label={`Expand module ${module.chapterNumber}: ${module.title}`}>
                <div className="text-left flex-1">
                  <h3 className="text-sm md:text-base font-medium">{module.title}</h3>
                  {module.description && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2 md:line-clamp-none">
                      {module.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      <span className="sr-only">Number of sub-modules:</span>
                      {module.subModules?.length || 0} Sub-modules
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <span className="sr-only">Number of documents:</span>
                      {module.documents?.length || 0} Documents
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInlineEdit(module.id);
                  }}
                  title="Quick edit"
                  aria-label={`Edit module ${module.title}`}
                >
                  <Edit className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(module.id);
                  }}
                  aria-label={`Delete module ${module.title}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </>
          )}
        </div>

        {!isInlineEditing && (
          <AccordionContent>
            <div className="px-3 pb-4 pt-2 md:px-4">
              <div className="space-y-4">
                {/* Sub-modules section with drag-and-drop */}
                <div role="region" aria-label="Sub-modules">
                  <SubModuleList
                    subModules={module.subModules || []}
                    moduleId={module.id}
                    onRefresh={async () => {
                      // Refresh the parent module list
                      if (typeof window !== 'undefined') {
                        window.location.reload();
                      }
                    }}
                    allowCrossModuleDrag={true}
                  />
                </div>

                {/* Documents section */}
                <div role="region" aria-label="Module documents">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                    <h4 className="text-sm font-medium">Documents</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label="Upload document to module"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUploadDocument(module.id);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                      Upload Document
                    </Button>
                  </div>
                  {module.documents && module.documents.length > 0 ? (
                    <div className="space-y-2" role="list" aria-label="Document list">
                      {module.documents.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border rounded-md bg-accent/50 hover:bg-accent transition-colors"
                          role="listitem"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                              <h5 className="text-sm font-medium truncate">{doc.title}</h5>
                              {doc.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {doc.description}
                                </p>
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
                                window.open(doc.fileUrl, '_blank');
                              }}
                              title="View document"
                              aria-label={`View ${doc.title}`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
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
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground border rounded-md bg-accent/30">
                      <p className="text-sm">No documents uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AccordionContent>
        )}
      </AccordionItem>
    </div>
  );
}

export function ModuleList({ modules: initialModules, syllabusId, onRefresh }: ModuleListProps) {
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedModuleForUpload, setSelectedModuleForUpload] = useState<string | null>(null);

  // Use optimistic reordering hook
  const {
    items: modules,
    moveItem: moveModule,
    saveOrder: handleSaveOrder,
    isReordering: isSaving,
    hasChanges: hasOrderChanged,
  } = useOptimisticReorder({
    items: initialModules,
    onReorder: async (reorderedModules) => {
      // Update order and chapter numbers based on new positions
      const moduleOrders = reorderedModules.map((module, index) => ({
        id: module.id,
        order: index + 1,
        chapterNumber: index + 1,
      }));

      const result = await reorderModules({
        syllabusId,
        moduleOrders,
      });

      if (result.success) {
        await onRefresh();
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Module order saved successfully");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setIsFormOpen(true);
  };

  const handleInlineEdit = (moduleId: string) => {
    setInlineEditingId(moduleId);
  };

  const handleSaveInlineEdit = async (
    moduleId: string,
    title: string,
    description: string
  ) => {
    const existingModule = modules.find((m) => m.id === moduleId);
    if (!existingModule) return;

    setIsLoading(true);
    try {
      const result = await updateModule({
        id: moduleId,
        title,
        description,
        chapterNumber: existingModule.chapterNumber,
        order: existingModule.order,
        syllabusId: existingModule.syllabusId,
      });

      if (result.success) {
        toast.success("Module updated successfully");
        setInlineEditingId(null);
        await onRefresh();
      } else {
        toast.error(result.error || "Failed to update module");
      }
    } catch (error) {
      console.error("Error updating module:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInlineEdit = () => {
    setInlineEditingId(null);
  };

  const handleDelete = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module? This will also delete all sub-modules and documents.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteModule(moduleId);

      if (result.success) {
        toast.success("Module deleted successfully");
        await onRefresh();
      } else {
        toast.error(result.error || "Failed to delete module");
      }
    } catch (error) {
      console.error("Error deleting module:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddNew = () => {
    setEditingModule(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingModule(null);
  };

  const handleFormSuccess = async () => {
    setIsFormOpen(false);
    setEditingModule(null);
    setIsLoading(true);
    await onRefresh();
    setIsLoading(false);
  };

  const hasOrderChangedCheck = () => {
    return hasOrderChanged;
  };

  const handleBulkDelete = async () => {
    if (selectedModules.size === 0) {
      toast.error("No modules selected");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedModules.size} module(s)? This will also delete all sub-modules and documents.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedModules).map((moduleId) =>
        deleteModule(moduleId)
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter((r) => r.success).length;

      if (successCount === selectedModules.size) {
        toast.success(`${successCount} module(s) deleted successfully`);
      } else {
        toast.error(`Only ${successCount} of ${selectedModules.size} module(s) deleted`);
      }

      setSelectedModules(new Set());
      await onRefresh();
    } catch (error) {
      console.error("Error deleting modules:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadDocument = (moduleId: string) => {
    setSelectedModuleForUpload(moduleId);
    setUploadDialogOpen(true);
  };

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
    setSelectedModuleForUpload(null);
  };

  const handleUploadSuccess = async () => {
    await onRefresh();
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4" role="region" aria-label="Module management">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base md:text-lg font-medium">Modules</h3>
            <Badge variant="secondary" aria-label={`${modules.length} modules`}>{modules.length}</Badge>
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Loading" />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedModules.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isDeleting}
                aria-label={`Delete ${selectedModules.size} selected modules`}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    Delete Selected ({selectedModules.size})
                  </>
                )}
              </Button>
            )}
            {hasOrderChangedCheck() && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveOrder}
                disabled={isSaving}
                aria-label="Save module order"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  "Save Order"
                )}
              </Button>
            )}
            <Button size="sm" onClick={handleAddNew} aria-label="Add new module">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Add Module</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {isLoading && modules.length === 0 ? (
          <ModuleListSkeleton count={3} />
        ) : modules.length === 0 ? (
          <Card className="p-6 md:p-8">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" aria-hidden="true" />
              <h3 className="text-base md:text-lg font-medium mb-1">No Modules Yet</h3>
              <p className="text-sm mb-4">
                Start building your syllabus by adding modules (chapters)
              </p>
              <Button onClick={handleAddNew} aria-label="Add first module">
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Add First Module
              </Button>
            </div>
          </Card>
        ) : (
          <Accordion type="multiple" className="w-full" role="list" aria-label="Modules list">
            {modules.map((module, index) => (
              <DraggableModule
                key={module.id}
                module={module}
                index={index}
                moveModule={moveModule}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onInlineEdit={handleInlineEdit}
                isInlineEditing={inlineEditingId === module.id}
                onSaveInlineEdit={handleSaveInlineEdit}
                onCancelInlineEdit={handleCancelInlineEdit}
                isExpanded={false}
                onUploadDocument={handleUploadDocument}
                onRefresh={onRefresh}
              />
            ))}
          </Accordion>
        )}

        <ModuleFormDialog
          open={isFormOpen}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          syllabusId={syllabusId}
          module={editingModule}
          existingChapterNumbers={modules
            .filter((m) => m.id !== editingModule?.id)
            .map((m) => m.chapterNumber)}
        />

        <DocumentUploadDialog
          open={uploadDialogOpen}
          onClose={handleUploadDialogClose}
          onSuccess={handleUploadSuccess}
          moduleId={selectedModuleForUpload || undefined}
        />
      </div>
    </DndProvider>
  );
}
