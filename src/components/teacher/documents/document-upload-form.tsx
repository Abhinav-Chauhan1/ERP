"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, FileText, Loader2 } from "lucide-react";
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
import { toast } from "react-hot-toast";
import { R2UploadWidget } from "@/components/upload/r2-upload-widget";
import {
  documentCategoryEnum,
  MAX_FILE_SIZE,
  ALLOWED_DOCUMENT_TYPES,
  validateFile,
} from "@/lib/schemas/teacher-schemas";
import { FormErrorDisplay } from "@/components/shared/form-error-display";
import { retryFetch } from "@/lib/utils/error-recovery";

// Client-side form schema (without server-only fields)
const formSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  category: documentCategoryEnum,
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DocumentUploadFormProps {
  userId: string;
}

export function DocumentUploadForm({ userId }: DocumentUploadFormProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Array<{ field: string; message: string }>>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "OTHER",
      tags: "",
    },
  });

  const validateFileInput = (file: File): boolean => {
    setFileError(null);

    const validation = validateFile({ size: file.size, type: file.type });
    
    if (!validation.valid) {
      setFileError(validation.errors.join('. '));
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (validateFileInput(file)) {
      setSelectedFile(file);
      // Auto-fill title if empty
      if (!form.getValues('title')) {
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        form.setValue('title', fileName);
      }
    } else {
      setSelectedFile(null);
      e.target.value = ''; // Clear the input
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setServerErrors([]); // Clear previous errors

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);

      // Upload to R2 storage using R2 upload widget
      // This has been integrated with the R2 storage service
      console.warn("Document upload temporarily disabled during migration to R2 storage");
      throw new Error("Document upload temporarily disabled during migration to R2 storage");
      
      // Unreachable code below - kept for when upload is re-enabled
      const uploadResult = { secure_url: '', bytes: 0 }; // Placeholder
      clearInterval(progressInterval);
      setUploadProgress(95);

      // Create document record with retry logic
      if (!selectedFile) {
        throw new Error("No file selected");
      }

      const response = await retryFetch(
        '/api/teacher/documents',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: values.title,
            description: values.description || null,
            fileName: selectedFile!.name,
            fileUrl: uploadResult.secure_url,
            fileType: selectedFile!.type,
            fileSize: uploadResult.bytes,
            category: values.category,
            tags: values.tags || null,
            userId,
          }),
        },
        {
          maxRetries: 2,
          initialDelay: 1000,
          onRetry: (attempt) => {
            toast.loading(`Retrying... (attempt ${attempt})`, { id: 'retry-toast' });
          },
        }
      );
      
      // Dismiss retry toast if it exists
      toast.dismiss('retry-toast');

      if (!response.ok) {
        const error = await response.json();
        
        // Handle validation errors
        if (error.errors && Array.isArray(error.errors)) {
          setServerErrors(error.errors);
          error.errors.forEach((err: { field: string; message: string }) => {
            if (err.field && err.message) {
              form.setError(err.field as any, { message: err.message });
            }
          });
          throw new Error(error.message || 'Please correct the errors and try again');
        }
        
        throw new Error(error.message || 'Failed to create document');
      }

      setUploadProgress(100);
      toast.success('Document uploaded successfully');
      
      // Redirect to documents page
      router.push('/teacher/documents');
      router.refresh();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload document');
      // Note: Form values are preserved automatically by react-hook-form
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Server Errors Display */}
        {serverErrors.length > 0 && (
          <FormErrorDisplay
            message="Please correct the following errors:"
            errors={serverErrors}
          />
        )}

        {/* File Upload */}
        <div className="space-y-2">
          <label htmlFor="file-upload" className="text-sm font-medium">
            Document File *
          </label>
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isUploading ? 'bg-muted border-muted' : 'border-border hover:border-primary'
          }`}>
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer flex flex-col items-center ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-10 w-10 text-primary mb-3 animate-spin" />
                  <span className="text-sm font-medium">Uploading... {uploadProgress}%</span>
                </>
              ) : selectedFile ? (
                <>
                  <FileText className="h-10 w-10 text-primary mb-3" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <span className="text-sm font-medium">Click to select file or drag and drop</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    PDF, Word, Excel, PowerPoint, Images up to 10MB
                  </span>
                </>
              )}
            </label>
            
            {uploadProgress > 0 && (
              <div className="w-full mt-4">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          {fileError && (
            <p className="text-sm text-destructive">{fileError}</p>
          )}
        </div>

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Enter document title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter document description (optional)"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide a brief description of the document
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                  <SelectItem value="ID_PROOF">ID Proof</SelectItem>
                  <SelectItem value="TEACHING_MATERIAL">Teaching Material</SelectItem>
                  <SelectItem value="LESSON_PLAN">Lesson Plan</SelectItem>
                  <SelectItem value="CURRICULUM">Curriculum</SelectItem>
                  <SelectItem value="POLICY">Policy</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the category that best describes this document
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input placeholder="e.g. math, grade-10, semester-1" {...field} />
              </FormControl>
              <FormDescription>
                Add comma-separated tags to help organize and search documents
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isUploading || !selectedFile}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
