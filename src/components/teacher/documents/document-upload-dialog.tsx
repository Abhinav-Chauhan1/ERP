"use client";

/**
 * Document Upload Dialog for Teachers
 * Demonstrates secure file upload with validation
 * Requirements: 1.2, 9.5
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SecureFileUpload } from "@/components/shared/secure-file-upload";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DocumentFormData {
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
}: DocumentUploadDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<DocumentFormData>>({
    title: "",
    description: "",
    category: "TEACHING_MATERIAL",
  });

  const handleUploadComplete = (result: {
    url: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      fileUrl: result.url,
      fileName: result.fileName,
      fileSize: result.fileSize,
      fileType: result.fileType,
    }));

    toast({
      title: "File uploaded",
      description: "File uploaded successfully. Please fill in the details.",
    });
  };

  const handleUploadError = (error: string) => {
    toast({
      title: "Upload failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fileUrl) {
      toast({
        title: "No file uploaded",
        description: "Please upload a file before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title) {
      toast({
        title: "Title required",
        description: "Please enter a title for the document.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would call your API to save the document metadata
      // For example:
      // const response = await fetch("/api/teacher/documents", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(formData),
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Document saved",
        description: "Your document has been saved successfully.",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "TEACHING_MATERIAL",
      });

      // Close dialog
      onOpenChange(false);

      // Refresh the page
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document and provide details. All files are validated for
            security.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            <SecureFileUpload
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              folder="teacher/documents"
              category="document"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter document title"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                <SelectItem value="ID_PROOF">ID Proof</SelectItem>
                <SelectItem value="TEACHING_MATERIAL">
                  Teaching Material
                </SelectItem>
                <SelectItem value="LESSON_PLAN">Lesson Plan</SelectItem>
                <SelectItem value="CURRICULUM">Curriculum</SelectItem>
                <SelectItem value="POLICY">Policy</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter document description (optional)"
              rows={3}
            />
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
            <Button type="submit" disabled={isSubmitting || !formData.fileUrl}>
              {isSubmitting ? "Saving..." : "Save Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
