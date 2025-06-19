"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UploadCloud, File as FileIcon, AlertCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "react-hot-toast";
import { uploadDocument } from "@/lib/actions/student-document-actions";
import { uploadToCloudinary, getResourceType } from "@/lib/cloudinary";

interface DocumentType {
  id: string;
  name: string;
  description?: string | null;
}

// Form schema
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  documentTypeId: z.string().min(1, { message: "Please select a document type" }),
  file: z.instanceof(globalThis.File).optional(),
  fileUrl: z.string().url().optional(),
  isPublic: z.boolean().default(false),
  tags: z.string().optional(),
});

interface DocumentUploadFormProps {
  documentTypes: DocumentType[];
  userId: string;
  studentId: string;
}

export function DocumentUploadForm({ documentTypes, userId }: DocumentUploadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const router = useRouter();
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      documentTypeId: "",
      isPublic: false,
      tags: "",
    },
  });
  
  // Upload file to Cloudinary
  const uploadFileToCloudinary = async (file: File) => {
    try {
      setUploadProgress(10);
      setUploadError(null);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      // Upload to Cloudinary with folder specific to documents
      const result = await uploadToCloudinary(file, {
        folder: `documents/${userId}`,
        resource_type: getResourceType(file.type),
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      return result.secure_url;
    } catch (error) {
      setUploadError("Failed to upload file. Please try again.");
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };
  
  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedFile && !values.fileUrl) {
      toast.error("Please select a file to upload or provide a file URL");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let fileUrl = values.fileUrl;
      
      // If a file was selected for upload
      if (selectedFile) {
        // Upload file to Cloudinary
        fileUrl = await uploadFileToCloudinary(selectedFile);
      }
      
      const documentData = {
        title: values.title,
        description: values.description || "",
        documentTypeId: values.documentTypeId,
        fileName: selectedFile ? selectedFile.name : "External URL",
        fileUrl: fileUrl || "",
        fileType: selectedFile ? selectedFile.type : "url",
        fileSize: selectedFile ? selectedFile.size : 0,
        isPublic: values.isPublic,
        tags: values.tags,
      };
      
      const result = await uploadDocument(documentData);
      
      if (result.success) {
        toast.success(result.message);
        form.reset();
        setSelectedFile(null);
        setUploadProgress(0);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to upload document");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }
      
      setSelectedFile(file);
      setUploadError(null);
      setUploadProgress(0);
      
      // Auto-populate title if empty
      const currentTitle = form.getValues("title");
      if (!currentTitle) {
        // Remove extension from filename
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        form.setValue("title", fileName);
      }
    }
  };
  
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
                <Select onValueChange={field.onChange} value={field.value}>
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
                <Textarea
                  placeholder="Brief description of the document"
                  className="h-20"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormLabel>Upload File</FormLabel>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium">
                    {selectedFile ? selectedFile.name : "Click to select file"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedFile 
                      ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` 
                      : "PDF, DOCX, JPG, PNG (max 10MB)"}
                  </p>
                </div>
              </label>
            </div>
            
            {selectedFile && (
              <div className="space-y-2">
                <div className="flex items-center p-2 bg-blue-50 rounded-md">
                  <FileIcon className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-700 truncate">{selectedFile.name}</span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="ml-auto p-1 h-auto" 
                    onClick={() => setSelectedFile(null)}
                    disabled={isSubmitting}
                  >
                    Remove
                  </Button>
                </div>
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Preparing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1" />
                  </div>
                )}
              </div>
            )}
            
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Upload Error</AlertTitle>
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <div>
            <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Or Enter File URL
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/document.pdf" 
                      {...field} 
                      value={field.value || ""}
                      disabled={!!selectedFile || isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a URL if the file is stored externally
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., assignment, certificate, transcript" 
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Separate tags with commas
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex flex-row items-end space-x-3 space-y-0 rounded-md p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Make this document public</FormLabel>
                  <FormDescription>
                    Public documents can be viewed by staff members
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full md:w-auto"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Uploading..." : "Upload Document"}
        </Button>
      </form>
    </Form>
  );
}
