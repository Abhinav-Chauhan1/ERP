"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Loader2, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAssignmentSubmissionSchema, submitAssignment } from "@/lib/actions/student-assessment-actions";

// Define a local schema that matches the server schema for type safety
const localSubmissionSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  content: z.string().optional(),
  attachments: z.string().optional(),
});

type FormValues = z.infer<typeof localSubmissionSchema>;

interface AssignmentSubmissionFormProps {
  assignmentId: string;
  dueDate: Date | string;
}

import { toast } from "react-hot-toast";

export function AssignmentSubmissionForm({
  assignmentId,
  dueDate
}: AssignmentSubmissionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isOverdue = new Date(dueDate) < new Date();

  const form = useForm<FormValues>({
    resolver: zodResolver(localSubmissionSchema),
    defaultValues: {
      assignmentId,
      content: "",
      attachments: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitAssignment(values);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setError("Failed to submit assignment");
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit assignment");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Success!</AlertTitle>
        <AlertDescription className="text-green-700">
          Your assignment has been submitted successfully!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      {isOverdue && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Warning!</AlertTitle>
          <AlertDescription className="text-amber-700">
            This assignment is past the due date. Your submission will be marked as late.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Error!</AlertTitle>
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignment Answer</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your assignment answer here..."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="attachments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attachments</FormLabel>
              <FormControl>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOCX, JPG, PNG (MAX. 10MB)
                      </p>
                    </div>
                    <input
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      disabled={isUploading || isSubmitting}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          setIsUploading(true);

                          if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
                            throw new Error("Cloudinary configuration missing");
                          }

                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

                          const response = await fetch(
                            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
                            {
                              method: 'POST',
                              body: formData,
                            }
                          );

                          if (!response.ok) {
                            throw new Error('Upload failed');
                          }

                          const data = await response.json();

                          // Convert to string format expected by server (JSON string of array)
                          const attachmentData = JSON.stringify([{
                            name: file.name,
                            url: data.secure_url,
                            type: file.type,
                            size: file.size
                          }]);

                          field.onChange(attachmentData);
                          toast.success("File uploaded successfully");
                        } catch (error) {
                          console.error("Upload error:", error);
                          toast.error("Failed to upload file");
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>Submit Assignment</>
          )}
        </Button>
      </form>
    </Form>
  );
}
