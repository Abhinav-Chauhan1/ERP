"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreVertical, Star, Copy, Trash2, Power, PowerOff, Eye } from "lucide-react";
import { TemplatePreview } from "./template-preview";
import { useToast } from "@/hooks/use-toast";
import {
  deleteReportCardTemplate,
  setDefaultTemplate,
  toggleTemplateActive,
  duplicateTemplate,
} from "@/lib/actions/reportCardTemplateActions";

interface TemplateActionsProps {
  template: any;
}

export function TemplateActions({ template }: TemplateActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSetDefault = async () => {
    setIsLoading(true);
    try {
      const result = await setDefaultTemplate(template.id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Template set as default",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to set default template",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    setIsLoading(true);
    try {
      const result = await toggleTemplateActive(template.id);
      if (result.success) {
        toast({
          title: "Success",
          description: `Template ${template.isActive ? "deactivated" : "activated"}`,
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to toggle template status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async () => {
    setIsLoading(true);
    try {
      const result = await duplicateTemplate(template.id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Template duplicated successfully",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to duplicate template",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteReportCardTemplate(template.id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Template deleted successfully",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete template",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isLoading}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowPreviewDialog(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!template.isDefault && (
            <DropdownMenuItem onClick={handleSetDefault}>
              <Star className="mr-2 h-4 w-4" />
              Set as Default
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleToggleActive}>
            {template.isActive ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template
              &quot;{template.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of &quot;{template.name}&quot; with sample data
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <TemplatePreview
              name={template.name}
              type={template.type}
              pageSize={template.pageSize}
              orientation={template.orientation}
              sections={template.sections || []}
              styling={template.styling || {
                primaryColor: "#1e40af",
                secondaryColor: "#64748b",
                fontFamily: "Arial",
                fontSize: 12,
                headerHeight: 100,
                footerHeight: 50,
              }}
              headerImage={template.headerImage}
              footerImage={template.footerImage}
              schoolLogo={template.schoolLogo}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
