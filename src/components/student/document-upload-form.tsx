"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UploadCloud, X, File, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

interface DocumentUploadFormProps {
  documentTypes: Array<{
    id: string;
    name: string;
  }>;
  userId: string;
  studentId: string;
}

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  documentTypeId: z.string().min(1, { message: "Please select a document type" }),
  fileUrl: z.string().min(1, { message: "Please upload a file" }),
  fileName: z.string().min(1, { message: "File name is required" }),
  tags: z.string().optional(),
});

export function DocumentUploadForm({ documentTypes, userId, studentId }: DocumentUploadFormProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      documentTypeId: "",
      fileUrl: "",
      fileName: "",
      tags: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          userId,
          studentId,
          isPublic: false,
          fileType: data.fileName.split('.').pop(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save document");
      }

      toast.success("Document uploaded successfully");
      router.refresh();
      form.reset();
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter document title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="documentTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter document description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter tags separated by commas" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fileUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upload Document</FormLabel>
              <FormControl>
                <div className="flex flex-col items-center">
                  {field.value ? (
                    <div className="flex items-center justify-between w-full p-4 border rounded-md bg-gray-50">
                      <div className="flex items-center gap-3">
                        <File className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">
                            {form.getValues("fileName")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {/* Format file size if available */}
                            Document uploaded successfully
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          form.setValue("fileUrl", "");
                          form.setValue("fileName", "");
                        }}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ) : (
                    <CldUploadWidget
                      uploadPreset="student_documents"
                      options={{
                        maxFileSize: 10000000, // 10MB
                        resourceType: "auto",
                        folder: `school-erp/students/${studentId}/documents`,
                      }}
                      onUpload={(result: any) => {
                        setIsUploading(false);
                        if (result.event !== "success") return;
                        
                        const info = result.info;
                        form.setValue("fileUrl", info.secure_url);
                        form.setValue("fileName", info.original_filename);
                        
                        // If no title set yet, use the filename
                        if (!form.getValues("title")) {
                          form.setValue("title", info.original_filename.split('.')[0]);
                        }
                      }}
                      onOpen={() => setIsUploading(true)}
                    >
                      {({ open }) => (
                        <div 
                          className="border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition w-full"
                          onClick={() => open?.()}
                        >
                          {isUploading ? (
                            <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
                          ) : (
                            <UploadCloud className="h-10 w-10 text-gray-400" />
                          )}
                          <p className="mt-2 text-sm font-medium">
                            {isUploading ? "Uploading..." : "Click to upload document"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Support for PDF, Word, Excel, PowerPoint, and images
                          </p>
                          <p className="text-xs text-gray-500">
                            Max file size: 10MB
                          </p>
                        </div>
                      )}
                    </CldUploadWidget>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting || isUploading}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : "Upload Document"}
        </Button>
      </form>
    </Form>
  );
}
