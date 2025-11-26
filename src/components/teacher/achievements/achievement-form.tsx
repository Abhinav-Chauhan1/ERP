"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";
import { achievementCategoryEnum } from "@/lib/schemas/teacher-schemas";
import { retryFetch } from "@/lib/utils/error-recovery";

// Client-side form schema (without server-only fields)
const achievementFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
  category: achievementCategoryEnum,
  date: z
    .string()
    .min(1, "Date is required")
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, "Invalid date format")
    .refine((date) => {
      const parsed = new Date(date);
      const now = new Date();
      return parsed <= now;
    }, "Date cannot be in the future"),
  documents: z.array(z.string().url("Invalid document URL")).optional(),
});

type AchievementFormValues = z.infer<typeof achievementFormSchema>;

type AchievementFormProps = {
  teacherId: string;
};

export function AchievementForm({ teacherId }: AchievementFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<AchievementFormValues>({
    resolver: zodResolver(achievementFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "AWARD",
      date: new Date().toISOString().split("T")[0],
      documents: [],
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        return data.url;
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedDocuments((prev) => [...prev, ...urls]);
      
      toast({
        title: "Success",
        description: `${files.length} document(s) uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload documents",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeDocument = (url: string) => {
    setUploadedDocuments((prev) => prev.filter((doc) => doc !== url));
  };

  const onSubmit = async (values: AchievementFormValues) => {
    setIsSubmitting(true);
    try {
      // Submit with retry logic for transient errors
      const response = await retryFetch(
        "/api/teacher/achievements",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...values,
            teacherId,
            documents: uploadedDocuments,
          }),
        },
        {
          maxRetries: 2,
          initialDelay: 1000,
          onRetry: (attempt) => {
            toast({
              title: "Retrying...",
              description: `Attempt ${attempt} of 3`,
            });
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        
        // Handle validation errors
        if (error.errors && Array.isArray(error.errors)) {
          error.errors.forEach((err: { field: string; message: string }) => {
            if (err.field && err.message) {
              form.setError(err.field as any, { message: err.message });
            }
          });
          throw new Error("Please correct the errors and try again");
        }
        
        throw new Error(error.message || "Failed to create achievement");
      }

      toast({
        title: "Success",
        description: "Achievement created successfully",
      });

      router.push("/teacher/achievements");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create achievement",
        variant: "destructive",
      });
      // Note: Form values are preserved automatically by react-hook-form
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Best Teacher Award 2024" 
                  {...field} 
                  aria-label="Achievement title"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger aria-label="Achievement category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AWARD">Award</SelectItem>
                  <SelectItem value="CERTIFICATION">Certification</SelectItem>
                  <SelectItem value="PROFESSIONAL_DEVELOPMENT">
                    Professional Development
                  </SelectItem>
                  <SelectItem value="PUBLICATION">Publication</SelectItem>
                  <SelectItem value="RECOGNITION">Recognition</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date *</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  {...field} 
                  aria-label="Achievement date"
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
                  placeholder="Describe your achievement..."
                  className="min-h-[100px]"
                  {...field}
                  aria-label="Achievement description"
                />
              </FormControl>
              <FormDescription>
                Provide details about your achievement
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Supporting Documents</FormLabel>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => document.getElementById("file-upload")?.click()}
              aria-label="Upload documents"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </>
              )}
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {uploadedDocuments.length > 0 && (
            <div className="space-y-2">
              {uploadedDocuments.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
                  <span className="text-sm truncate flex-1">
                    Document {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocument(url)}
                    aria-label={`Remove document ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            aria-label="Save achievement"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Achievement"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            aria-label="Cancel"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
