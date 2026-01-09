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
  subModuleSchema,
  subModuleUpdateSchema,
  type SubModuleFormValues,
  type SubModuleUpdateFormValues,
} from "@/lib/schemaValidation/subModuleSchemaValidations";
import { createSubModule, updateSubModule } from "@/lib/actions/subModuleActions";
import toast from "react-hot-toast";

interface SubModule {
  id: string;
  title: string;
  description: string | null;
  order: number;
  moduleId: string;
}

interface SubModuleFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleId: string;
  subModule?: SubModule | null;
  suggestedOrder?: number;
}

export function SubModuleFormDialog({
  open,
  onClose,
  onSuccess,
  moduleId,
  subModule,
  suggestedOrder = 1,
}: SubModuleFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!subModule;

  const form = useForm<SubModuleFormValues | SubModuleUpdateFormValues>({
    resolver: zodResolver(isEditing ? subModuleUpdateSchema : subModuleSchema),
    defaultValues: {
      title: "",
      description: "",
      order: 1,
      moduleId,
    },
  });

  useEffect(() => {
    if (open) {
      setError(null);
      if (subModule) {
        form.reset({
          id: subModule.id,
          title: subModule.title,
          description: subModule.description || "",
          order: subModule.order,
          moduleId: subModule.moduleId,
        });
      } else {
        // For new sub-modules, use the suggested next order
        form.reset({
          title: "",
          description: "",
          order: suggestedOrder,
          moduleId,
        });
      }
    }
  }, [open, subModule, moduleId, form, suggestedOrder]);

  const onSubmit = async (values: SubModuleFormValues | SubModuleUpdateFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let result;

      if (isEditing && "id" in values) {
        result = await updateSubModule(values as SubModuleUpdateFormValues);
      } else {
        result = await createSubModule(values as SubModuleFormValues);
      }

      if (result.success) {
        toast.success(
          `Sub-module ${isEditing ? "updated" : "created"} successfully`
        );
        onSuccess();
      } else {
        setError(result.error || "An error occurred");
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error("Error submitting sub-module form:", err);
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
      <DialogContent className="sm:max-w-[500px]" aria-describedby="submodule-form-description">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Sub-module" : "Add New Sub-module"}
          </DialogTitle>
          <DialogDescription id="submodule-form-description">
            {isEditing
              ? "Update the details of this sub-module (topic)"
              : "Add a new sub-module (topic) to this module"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-label={isEditing ? "Edit sub-module form" : "Add sub-module form"}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="submodule-title">Sub-module Title *</FormLabel>
                  <FormControl>
                    <Input
                      id="submodule-title"
                      placeholder="e.g. Linear Equations"
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
                  <FormLabel htmlFor="submodule-description">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      id="submodule-description"
                      placeholder="Brief description of the sub-module"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                      disabled={isSubmitting}
                      aria-invalid={!!form.formState.errors.description}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description to help students understand the topic
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
                  <FormLabel htmlFor="submodule-order">Display Order *</FormLabel>
                  <FormControl>
                    <Input
                      id="submodule-order"
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
                    Position within the module
                  </FormDescription>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

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
                  <>{isEditing ? "Update Sub-module" : "Create Sub-module"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
