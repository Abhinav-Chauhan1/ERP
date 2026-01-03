"use client";

/**
 * Loading States Demo Component
 * Demonstrates all loading states and optimistic updates
 * Requirements: Task 16 - Loading states and optimistic updates
 * 
 * This component serves as documentation and testing for:
 * - Skeleton loaders for module lists
 * - Loading spinners for file uploads
 * - Optimistic UI updates for reordering
 * - Progress indicators for bulk operations
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ModuleListSkeleton,
  SubModuleListSkeleton,
  DocumentListSkeleton,
  FileUploadProgress,
  SingleFileUploadProgress,
  BulkUploadSummary,
  type FileUploadStatus,
} from "./loading-states";

export function LoadingStatesDemo() {
  const [showModuleSkeleton, setShowModuleSkeleton] = useState(false);
  const [showSubModuleSkeleton, setShowSubModuleSkeleton] = useState(false);
  const [showDocumentSkeleton, setShowDocumentSkeleton] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mock file upload data
  const mockFiles: FileUploadStatus[] = [
    {
      filename: "lecture-notes.pdf",
      fileSize: 2048000,
      status: "success",
      progress: 100,
    },
    {
      filename: "assignment-1.docx",
      fileSize: 512000,
      status: "uploading",
      progress: 65,
    },
    {
      filename: "presentation.pptx",
      fileSize: 4096000,
      status: "error",
      progress: 30,
      error: "File size exceeds limit",
    },
    {
      filename: "video-tutorial.mp4",
      fileSize: 10240000,
      status: "pending",
      progress: 0,
    },
  ];

  const simulateUpload = () => {
    setShowFileUpload(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Loading States Demo</h1>
        <p className="text-muted-foreground">
          Demonstration of all loading states and optimistic updates for the Enhanced Syllabus System
        </p>
      </div>

      <Tabs defaultValue="skeletons" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="skeletons">Skeleton Loaders</TabsTrigger>
          <TabsTrigger value="file-upload">File Upload</TabsTrigger>
          <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
          <TabsTrigger value="optimistic">Optimistic Updates</TabsTrigger>
        </TabsList>

        {/* Skeleton Loaders Tab */}
        <TabsContent value="skeletons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Module List Skeleton</CardTitle>
              <CardDescription>
                Shown while modules are being fetched from the server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setShowModuleSkeleton(!showModuleSkeleton)}
              >
                {showModuleSkeleton ? "Hide" : "Show"} Module Skeleton
              </Button>
              {showModuleSkeleton && <ModuleListSkeleton count={3} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sub-Module List Skeleton</CardTitle>
              <CardDescription>
                Shown while sub-modules are being fetched
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setShowSubModuleSkeleton(!showSubModuleSkeleton)}
              >
                {showSubModuleSkeleton ? "Hide" : "Show"} Sub-Module Skeleton
              </Button>
              {showSubModuleSkeleton && <SubModuleListSkeleton count={2} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document List Skeleton</CardTitle>
              <CardDescription>
                Shown while documents are being loaded
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setShowDocumentSkeleton(!showDocumentSkeleton)}
              >
                {showDocumentSkeleton ? "Hide" : "Show"} Document Skeleton
              </Button>
              {showDocumentSkeleton && <DocumentListSkeleton count={2} />}
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Upload Tab */}
        <TabsContent value="file-upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Single File Upload Progress</CardTitle>
              <CardDescription>
                Progress indicator for individual file uploads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={simulateUpload}>
                Simulate Upload
              </Button>
              {showFileUpload && (
                <SingleFileUploadProgress
                  filename="example-document.pdf"
                  progress={uploadProgress}
                  status={
                    uploadProgress === 0
                      ? "uploading"
                      : uploadProgress < 100
                      ? "processing"
                      : "complete"
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Multiple File Upload Progress</CardTitle>
              <CardDescription>
                Shows status for multiple files being uploaded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadProgress files={mockFiles} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Upload Tab */}
        <TabsContent value="bulk-upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload Summary</CardTitle>
              <CardDescription>
                Summary statistics for bulk upload operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkUploadSummary
                total={10}
                successful={7}
                failed={2}
                inProgress={1}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Complete Bulk Upload Flow</CardTitle>
              <CardDescription>
                Full bulk upload experience with progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BulkUploadSummary
                total={mockFiles.length}
                successful={mockFiles.filter((f) => f.status === "success").length}
                failed={mockFiles.filter((f) => f.status === "error").length}
                inProgress={mockFiles.filter((f) => f.status === "uploading").length}
              />
              <FileUploadProgress files={mockFiles} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimistic Updates Tab */}
        <TabsContent value="optimistic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimistic Reordering</CardTitle>
              <CardDescription>
                UI updates immediately when dragging items, with rollback on error
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Immediate visual feedback when dragging modules/sub-modules</li>
                  <li>Automatic rollback if server update fails</li>
                  <li>"Save Order" button appears when changes are detected</li>
                  <li>Loading spinner during save operation</li>
                  <li>Toast notifications for success/error states</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm">
                  <strong>Implementation:</strong> The <code>useOptimisticReorder</code> hook
                  manages the optimistic update flow. When items are dragged, the UI updates
                  immediately. If the server save fails, the UI automatically reverts to the
                  previous state.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Optimistic Inline Editing</CardTitle>
              <CardDescription>
                Inline edits show loading state and revert on error
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Loading spinner appears next to section title during save</li>
                  <li>Form remains editable during save operation</li>
                  <li>Automatic revert if save fails</li>
                  <li>Success/error toast notifications</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
          <CardDescription>
            How to use these loading states in your components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Skeleton Loaders</h4>
            <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`import { ModuleListSkeleton } from "@/components/academic/loading-states";

{isLoading ? (
  <ModuleListSkeleton count={3} />
) : (
  <ModuleList modules={modules} />
)}`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">2. File Upload Progress</h4>
            <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`import { FileUploadProgress } from "@/components/academic/loading-states";

<FileUploadProgress files={uploadingFiles} />`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">3. Optimistic Reordering</h4>
            <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`import { useOptimisticReorder } from "@/hooks/use-optimistic-reorder";

const { items, moveItem, saveOrder, hasChanges } = useOptimisticReorder({
  items: initialItems,
  onReorder: async (items) => {
    return await reorderModules(items);
  },
  onSuccess: () => toast.success("Order saved"),
  onError: (error) => toast.error(error),
});`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
