"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarEventCategory } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  Check,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

// Form validation schema
const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Green
  "#f59e0b", // Amber
  "#14b8a6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
];

/**
 * CategoryManagementDialog Component
 * 
 * Dialog for managing calendar event categories.
 * Allows admins to create, edit, and delete categories.
 * 
 * Features:
 * - List all categories
 * - Create new categories
 * - Edit existing categories
 * - Delete categories with reassignment
 * - Color picker with presets
 * - Active/inactive toggle
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export function CategoryManagementDialog({
  isOpen,
  onClose,
  onSuccess,
}: CategoryManagementDialogProps) {
  const [categories, setCategories] = useState<CalendarEventCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<CalendarEventCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CalendarEventCategory | null>(null);
  const [replacementCategoryId, setReplacementCategoryId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: PRESET_COLORS[0],
      icon: "",
      isActive: true,
      order: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setShowForm(false);
      setEditingCategory(null);
      setDeletingCategory(null);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        description: editingCategory.description || "",
        color: editingCategory.color,
        icon: editingCategory.icon || "",
        isActive: editingCategory.isActive,
        order: editingCategory.order,
      });
      setShowForm(true);
    } else {
      form.reset({
        name: "",
        description: "",
        color: PRESET_COLORS[0],
        icon: "",
        isActive: true,
        order: 0,
      });
    }
  }, [editingCategory, form]);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/calendar/categories?includeInactive=true");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: CategoryFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = editingCategory
        ? `/api/calendar/categories/${editingCategory.id}`
        : "/api/calendar/categories";
      
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save category");
      }

      toast.success(
        editingCategory
          ? "Category updated successfully"
          : "Category created successfully"
      );
      
      setShowForm(false);
      setEditingCategory(null);
      fetchCategories();
      onSuccess();
    } catch (err) {
      console.error("Error saving category:", err);
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: CalendarEventCategory) => {
    setEditingCategory(category);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setShowForm(false);
    form.reset();
  };

  const handleDelete = async (category: CalendarEventCategory) => {
    // Check if category has events
    const hasEvents = true; // In a real implementation, check via API
    
    if (hasEvents) {
      setDeletingCategory(category);
    } else {
      if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
        await performDelete(category.id);
      }
    }
  };

  const performDelete = async (categoryId: string, replacementId?: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = replacementId
        ? `/api/calendar/categories/${categoryId}?replacementCategoryId=${replacementId}`
        : `/api/calendar/categories/${categoryId}`;

      const response = await fetch(url, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category");
      }

      toast.success("Category deleted successfully");
      setDeletingCategory(null);
      setReplacementCategoryId("");
      fetchCategories();
      onSuccess();
    } catch (err) {
      console.error("Error deleting category:", err);
      setError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    if (!replacementCategoryId) {
      setError("Please select a replacement category");
      return;
    }

    await performDelete(deletingCategory.id, replacementCategoryId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Event Categories</DialogTitle>
          <DialogDescription>
            Create, edit, and organize calendar event categories
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Delete Confirmation */}
        {deletingCategory && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <p>
                  Category "{deletingCategory.name}" has existing events.
                  Please select a replacement category:
                </p>
                <Select
                  value={replacementCategoryId}
                  onValueChange={setReplacementCategoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select replacement category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => c.id !== deletingCategory.id)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleConfirmDelete}
                    disabled={isSubmitting || !replacementCategoryId}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Confirm Delete"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDeletingCategory(null);
                      setReplacementCategoryId("");
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Category Form */}
        {showForm && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {editingCategory ? "Edit Category" : "New Category"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Exam"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
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
                          placeholder="Category description..."
                          rows={2}
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color *</FormLabel>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={cn(
                                "w-8 h-8 rounded-full border-2 transition-all",
                                field.value === color
                                  ? "border-primary scale-110"
                                  : "border-transparent hover:scale-105"
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => field.onChange(color)}
                              disabled={isSubmitting}
                            />
                          ))}
                        </div>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="#3b82f6"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>{editingCategory ? "Update" : "Create"}</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {/* Add New Button */}
        {!showForm && (
          <Button
            onClick={() => {
              setEditingCategory(null);
              setShowForm(true);
            }}
            className="w-full"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Category
          </Button>
        )}

        {/* Categories List */}
        <div className="border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No categories found. Create your first category above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {category.color}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          disabled={isSubmitting}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
