"use client";

/**
 * Document Management Example Component
 * Demonstrates how to use the document management components
 * This is an example/demo component - not for production use
 */

import { useState } from "react";
import { DocumentManagement } from "./document-management";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocumentManagementExampleProps {
  moduleId?: string;
  subModuleId?: string;
  userId: string;
}

export function DocumentManagementExample({
  moduleId = "example-module-id",
  subModuleId = "example-submodule-id",
  userId,
}: DocumentManagementExampleProps) {
  const [activeTab, setActiveTab] = useState<"module" | "submodule">("module");

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Management System</CardTitle>
          <CardDescription>
            Upload, organize, and manage documents for modules and sub-modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="module">Module Documents</TabsTrigger>
              <TabsTrigger value="submodule">Sub-Module Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="module" className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Module Document Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Documents attached to a module are visible to all sub-modules within
                  that module. Use this for chapter-level resources.
                </p>
                <DocumentManagement
                  parentId={moduleId}
                  parentType="module"
                  uploadedBy={userId}
                  showActions={true}
                  enableReordering={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="submodule" className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Sub-Module Document Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Documents attached to a sub-module are specific to that topic. Use
                  this for topic-specific resources.
                </p>
                <DocumentManagement
                  parentId={subModuleId}
                  parentType="subModule"
                  uploadedBy={userId}
                  showActions={true}
                  enableReordering={true}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">📤 Bulk Upload</h4>
              <p className="text-sm text-muted-foreground">
                Upload multiple documents at once with progress tracking
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">🎯 Drag & Drop</h4>
              <p className="text-sm text-muted-foreground">
                Reorder documents by dragging them to new positions
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">✏️ Edit Metadata</h4>
              <p className="text-sm text-muted-foreground">
                Update document titles and descriptions without re-uploading
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">📁 File Types</h4>
              <p className="text-sm text-muted-foreground">
                Support for PDF, Word, PowerPoint, images, and videos
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">🔍 Preview & Download</h4>
              <p className="text-sm text-muted-foreground">
                View documents in browser or download them directly
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">🗑️ Safe Deletion</h4>
              <p className="text-sm text-muted-foreground">
                Delete documents from both database and cloud storage
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
