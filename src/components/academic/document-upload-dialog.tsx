"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { useAuth } from "@/lib/auth-context";
import { Upload, Loader2, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadDocument } from "@/lib/actions/syllabusDocumentActions";
import { uploadToCloudinary } from "@/lib/cloudinary";
import toast from "react-hot-toast";

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  moduleId?: string;
  subModuleId?: string;
}

interface FormValues {
  title: string;
  description: string;
  fileUrl: string;
  filename: string;
  fileSize: number;
  fileType: string;
}

export function DocumentUploadDialog({
  open,
  onClose,
  onSuccess,
  moduleId,
  subModuleId,
}: DocumentUploadDialogProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    filename: string;
    size: number;
    type: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      fileUrl: "",
      filename: "",
      fileSize: 0,
      fileType: "",
    },
  });

  const handleClose = () => {
    reset();
    setUploadedFile(null);
    setUploadProgress(0);
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB max)
    if (file.size > 52428800) {
      toast.error("File size exceeds 50MB limit");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Create simulated progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 5;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(file, "syllabus-documents");

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Get file extension and convert to proper format
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

      // Set uploaded file info
      setUploadedFile({
        url: uploadResult.secure_url,
        filename: file.name,
        size: uploadResult.bytes,
        type: file.type, // Use the browser's MIME type
      });

      setValue("fileUrl", uploadResult.secure_url);
      setValue("filename", file.name);
      setValue("fileSize", uploadResult.bytes);
      setValue("fileType", file.type); // Use the browser's MIME type

      // Auto-fill title if empty
      if (!watch("title")) {
        setValue("title", file.name);
      }

      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!uploadedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!moduleId && !subModuleId) {
      toast.error("Invalid module or sub-module reference");
      return;
    }

    if (!userId) {
      toast.error("You must be logged in to upload documents");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await uploadDocument({
        title: data.title || uploadedFile.filename,
        description: data.description || undefined,
        filename: uploadedFile.filename,
        fileUrl: uploadedFile.url,
        fileSize: uploadedFile.size,
        fileType: uploadedFile.type,
        moduleId,
        subModuleId,
        uploadedBy: userId,
      });

      if (result.success) {
        toast.success("Document uploaded successfully");
        handleClose();
        await onSuccess();
      } else {
        toast.error(result.error || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document to {moduleId ? "this module" : "this sub-module"}.
            Supported formats: PDF, Word, PowerPoint, images, and videos (max 50MB).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>File *</Label>
            <div
              className={`border-dashed border-2 border-gray-300 rounded-lg p-8 text-center ${uploading ? "bg-accent" : ""
                }`}
            >
              <Input
                type="file"
                className="hidden"
                id="file-upload"
                onChange={handleFileChange}
                disabled={uploading || isSubmitting}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov"
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer flex flex-col items-center ${uploading ? "opacity-50" : ""
                  }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-8 w-8 text-primary mb-2 animate-spin" />
                    <span className="text-sm font-medium">
                      Uploading... {uploadProgress}%
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">
                      Click to select file or drag and drop
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      PDF, Word, PowerPoint, Images, Videos up to 50MB
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
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {uploadedFile && (
              <div className="flex items-center p-3 bg-primary/10 rounded-md">
                <FileText className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">
                    {uploadedFile.filename}
                  </p>
                  <p className="text-xs text-primary">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter document title (defaults to filename)"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter document description"
              rows={3}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || uploading || !uploadedFile}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
