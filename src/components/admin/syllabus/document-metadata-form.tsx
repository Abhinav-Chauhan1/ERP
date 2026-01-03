"use client";

/**
 * Document Metadata Form Component
 * Form for editing document title and description
 * Requirements: 4.1, 4.4
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateDocumentMetadata } from "@/lib/actions/syllabusDocumentActions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const documentMetadataSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

type DocumentMetadataFormValues = z.infer<typeof documentMetadataSchema>;

interface DocumentMetadataFormProps {
  document: {
    id: string;
    title: string;
    description?: string | null;
    filename: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DocumentMetadataForm({
  document,
  open,
  onOpenChange,
  onSuccess,
}: DocumentMetadataFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<DocumentMetadataFormValues>({
    resolver: zodResolver(documentMetadataSchema),
    defaultValues: {
      title: document.title,
      description: document.description || "",
    },
  });

  const onSubmit = async (values: DocumentMetadataFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await updateDocumentMetadata({
        id: document.id,
        title: values.title,
        description: values.description || undefined,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Document metadata updated successfully.",
        });
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(result.error || "Failed to update document");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update document",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Document Metadata</DialogTitle>
          <DialogDescription>
            Update the title and description for this document. The file itself will
            not be changed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter document title"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive title for the document
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter document description (optional)"
                      rows={4}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional details about the document content
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-sm text-muted-foreground">
              <p>
                <span className="font-medium">Filename:</span> {document.filename}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
