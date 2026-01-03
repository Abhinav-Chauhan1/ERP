"use client";

import { useState } from "react";
import {
  useModulesBySyllabus,
  usePaginatedModules,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useReorderModules,
} from "@/hooks/use-syllabus-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";

/**
 * Example component demonstrating cached module list with React Query
 * This component showcases:
 * - Automatic caching with React Query
 * - Optimistic updates
 * - Loading states
 * - Error handling
 * - Pagination
 */

interface CachedModuleListProps {
  syllabusId: string;
  usePagination?: boolean;
}

export function CachedModuleList({
  syllabusId,
  usePagination = false,
}: CachedModuleListProps) {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Always call hooks, handle logic inside
  const paginatedResult = usePaginatedModules(syllabusId, { page, pageSize }, { enabled: usePagination });
  const fullListResult = useModulesBySyllabus(syllabusId, { enabled: !usePagination });

  const {
    data: modules,
    isLoading,
    error,
    refetch,
  } = usePagination ? paginatedResult : fullListResult;

  // Mutations
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const reorderModules = useReorderModules();

  // Handle create
  const handleCreate = async () => {
    try {
      await createModule.mutateAsync({
        title: "New Module",
        description: "Module description",
        chapterNumber: (moduleList.length || 0) + 1,
        order: (moduleList.length || 0) + 1,
        syllabusId,
      });
    } catch (error) {
      console.error("Failed to create module:", error);
    }
  };

  // Handle update
  const handleUpdate = async (moduleId: string, currentTitle: string) => {
    try {
      await updateModule.mutateAsync({
        id: moduleId,
        title: `${currentTitle} (Updated)`,
        chapterNumber: 1,
        order: 1,
        syllabusId,
      });
    } catch (error) {
      console.error("Failed to update module:", error);
    }
  };

  // Handle delete
  const handleDelete = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;

    try {
      await deleteModule.mutateAsync({ id: moduleId, syllabusId });
    } catch (error) {
      console.error("Failed to delete module:", error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading modules: {error.message}
          <Button onClick={() => refetch()} variant="outline" size="sm" className="ml-4">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Get the actual modules array (handle both paginated and non-paginated)
  // Get the actual modules array (handle both paginated and non-paginated)
  // When disabled, data might be undefined, so we default to empty array
  const moduleList = usePagination
    ? (modules as any)?.modules || []
    : Array.isArray(modules) ? modules : [];

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Modules</h2>
        <Button
          onClick={handleCreate}
          disabled={createModule.isPending}
          size="sm"
        >
          {createModule.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </>
          )}
        </Button>
      </div>

      {/* Module list */}
      {moduleList.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No modules found. Create your first module to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {moduleList.map((module: any) => (
            <Card key={module.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      Chapter {module.chapterNumber}: {module.title}
                    </CardTitle>
                    {module.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {module.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdate(module.id, module.title)}
                      disabled={updateModule.isPending}
                    >
                      {updateModule.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Edit2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(module.id)}
                      disabled={deleteModule.isPending}
                    >
                      {deleteModule.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>Sub-modules: {module.subModules?.length || 0}</p>
                  <p>Documents: {module.documents?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination controls (if using pagination) */}
      {usePagination && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            onClick={() => setPage((old) => Math.max(old - 1, 1))}
            disabled={page === 1}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <span className="flex items-center px-4">Page {page}</span>
          <Button
            onClick={() => setPage((old) => old + 1)}
            disabled={!(modules as any)?.hasMore}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}

      {/* Cache info (development only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-muted-foreground mt-4 p-2 bg-muted rounded">
          <p>
            Cache Status: {isLoading ? "Loading" : "Cached"}
          </p>
          <p>
            Modules Count: {moduleList.length}
          </p>
          {usePagination && (
            <p>
              Has More: {(modules as any)?.hasMore ? "Yes" : "No"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
