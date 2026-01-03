"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  moduleSchema,
  moduleUpdateSchema,
  type ModuleFormValues,
  type ModuleUpdateFormValues,
} from "@/lib/schemaValidation/moduleSchemaValidations";
import { createModule, updateModule } from "@/lib/actions/moduleActions";
import toast from "react-hot-toast";

interface Module {
  id: string;
  title: string;
  description: string | null;
  chapterNumber: number;
  order: number;
  syllabusId: string;
}

interface ModuleFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  syllabusId: string;
  module?: Module | null;
  existingChapterNumbers?: number[];
}

export function ModuleFormDialog({
  open,
  onClose,
  onSuccess,
  syllabusId,
  module,
  existingChapterNumbers = [],
}: ModuleFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!module;

  const form = useForm<ModuleFormValues | ModuleUpdateFormValues>({
    resolver: zodResolver(isEditing ? moduleUpdateSchema : moduleSchema),
    defaultValues: {
      title: "",
      description: "",
      chapterNumber: 1,
      order: 1,
      syllabusId,
    },
  });

  useEffect(() => {
    if (open) {
      setError(null);
      if (module) {
        form.reset({
          id: module.id,
          title: module.title,
          description: module.description || "",
          chapterNumber: module.chapterNumber,
          order: module.order,
          syllabusId: module.syllabusId,
        });
      } else {
        // For new modules, suggest the next chapter number
        const maxChapterNumber = existingChapterNumbers.length > 0
          ? Math.max(...existingChapterNumbers)
          : 0;
        const nextChapterNumber = maxChapterNumber + 1;
        const nextOrder = existingChapterNumbers.length + 1;

        form.reset({
          title: "",
          description: "",
          chapterNumber: nextChapterNumber,
          order: nextOrder,
          syllabusId,
        });
      }
    }
  }, [open, module, syllabusId, existingChapterNumbers, form]);

  const onSubmit = async (values: ModuleFormValues | ModuleUpdateFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let result;

      if (isEditing && "id" in values) {
        result = await updateModule(values as ModuleUpdateFormValues);
      } else {
        result = await createModule(values as ModuleFormValues);
      }

      if (result.success) {
        toast.success(
          `Module ${isEditing ? "updated" : "created"} successfully`
        );
        onSuccess();
      } else {
        setError(result.error || "An error occurred");
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error("Error submitting module form:", err);
      const errorMessage = "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="module-form-description">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Module" : "Add New Module"}
          </DialogTitle>
          <DialogDescription id="module-form-description">
            {isEditing
              ? "Update the details of this module (chapter)"
              : "Add a new module (chapter) to the syllabus"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-label={isEditing ? "Edit module form" : "Add module form"}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="module-title">Module Title *</FormLabel>
                  <FormControl>
                    <Input
                      id="module-title"
                      placeholder="e.g. Introduction to Algebra"
                      {...field}
                      disabled={isSubmitting}
                      aria-required="true"
                      aria-invalid={!!form.formState.errors.title}
                    />
                  </FormControl>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="module-description">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      id="module-description"
                      placeholder="Brief description of the module"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                      disabled={isSubmitting}
                      aria-invalid={!!form.formState.errors.description}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description to help students understand the module
                  </FormDescription>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="chapterNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="chapter-number">Chapter Number *</FormLabel>
                    <FormControl>
                      <Input
                        id="chapter-number"
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                        disabled={isSubmitting}
                        aria-required="true"
                        aria-invalid={!!form.formState.errors.chapterNumber}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Must be unique
                    </FormDescription>
                    <FormMessage role="alert" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="display-order">Display Order *</FormLabel>
                    <FormControl>
                      <Input
                        id="display-order"
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                        disabled={isSubmitting}
                        aria-required="true"
                        aria-invalid={!!form.formState.errors.order}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Position in list
                    </FormDescription>
                    <FormMessage role="alert" />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{isEditing ? "Update Module" : "Create Module"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
