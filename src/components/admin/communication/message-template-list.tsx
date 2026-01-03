"use client";

import { useEffect, useState, useCallback } from "react";
import { getMessageTemplates, deleteMessageTemplate, duplicateMessageTemplate } from "@/lib/actions/messageTemplateActions";
import { MessageType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageSquare, MoreVertical, Copy, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface MessageTemplate {
  id: string;
  name: string;
  description: string | null;
  type: MessageType;
  category: string | null;
  subject: string | null;
  body: string;
  variables: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
}

export function MessageTemplateList() {
  const router = useRouter();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "sms" | "email" | "both">("all");

  const loadTemplates = useCallback(async function () {
    setLoading(true);
    try {
      const filters: any = {};
      if (activeTab !== "all") {
        filters.type = activeTab.toUpperCase() as MessageType;
      }

      const result = await getMessageTemplates(filters);
      if (result.success && result.data) {
        setTemplates(result.data);
      } else {
        toast.error(result.error || "Failed to load templates");
      }
    } catch (error) {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  async function handleDelete(id: string) {
    try {
      const result = await deleteMessageTemplate(id);
      if (result.success) {
        toast.success("Template deleted successfully");
        loadTemplates();
      } else {
        toast.error(result.error || "Failed to delete template");
      }
    } catch (error) {
      toast.error("Failed to delete template");
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const result = await duplicateMessageTemplate(id);
      if (result.success) {
        toast.success("Template duplicated successfully");
        loadTemplates();
      } else {
        toast.error(result.error || "Failed to duplicate template");
      }
    } catch (error) {
      toast.error("Failed to duplicate template");
    }
  }

  function getTypeIcon(type: MessageType) {
    switch (type) {
      case "SMS":
        return <MessageSquare className="h-4 w-4" />;
      case "EMAIL":
        return <Mail className="h-4 w-4" />;
      case "BOTH":
        return (
          <div className="flex gap-1">
            <MessageSquare className="h-4 w-4" />
            <Mail className="h-4 w-4" />
          </div>
        );
    }
  }

  function getTypeColor(type: MessageType) {
    switch (type) {
      case "SMS":
        return "bg-blue-500";
      case "EMAIL":
        return "bg-green-500";
      case "BOTH":
        return "bg-purple-500";
    }
  }

  if (loading) {
    return <div>Loading templates...</div>;
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="sms">SMS Only</TabsTrigger>
          <TabsTrigger value="email">Email Only</TabsTrigger>
          <TabsTrigger value="both">Both</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No templates found</p>
                <Link href="/admin/communication/templates/new">
                  <Button>Create Your First Template</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${getTypeColor(template.type)}`}>
                          {getTypeIcon(template.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          {template.category && (
                            <Badge variant="outline" className="mt-1">
                              {template.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/communication/templates/${template.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/communication/templates/${template.id}/edit`)}
                            disabled={template.isDefault}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setTemplateToDelete(template.id);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={template.isDefault}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {template.description && (
                      <CardDescription className="mt-2">{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {template.subject && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Subject:</p>
                          <p className="text-sm truncate">{template.subject}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Body Preview:</p>
                        <p className="text-sm line-clamp-3">{template.body}</p>
                      </div>
                      {template.variables.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Variables:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.slice(0, 3).map((variable) => (
                              <Badge key={variable} variant="secondary" className="text-xs">
                                {`{{${variable}}}`}
                              </Badge>
                            ))}
                            {template.variables.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.variables.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-2">
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {template.isDefault && (
                          <Badge variant="outline">System Default</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => templateToDelete && handleDelete(templateToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
