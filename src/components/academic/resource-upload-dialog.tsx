"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { FileText, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

// In a real app, this would upload to a backend
const mockUploadResource = async (data: FormData) => {
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true };
};

interface ResourceUploadDialogProps {
  subjectId: string;
  onSuccess?: () => Promise<void> | void;
}

export function ResourceUploadDialog({ subjectId, onSuccess }: ResourceUploadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState("document");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !file) {
      toast.error("Please provide a title and file");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("resourceType", resourceType);
      formData.append("file", file);
      formData.append("subjectId", subjectId);
      
      // In a real app, this would call an API endpoint
      await mockUploadResource(formData);
      
      toast.success("Resource uploaded successfully");
      setOpen(false);
      resetForm();
      
      if (onSuccess) {
        await onSuccess();
      }
      
      router.refresh();
    } catch (error) {
      console.error("Failed to upload resource:", error);
      toast.error("Failed to upload resource");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setResourceType("document");
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" /> Upload Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Upload Teaching Resource</DialogTitle>
          <DialogDescription>
            Add teaching materials for students and other teachers
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Resource Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Linear Equations Worksheet"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe this resource"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="resourceType">Resource Type</Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger id="resourceType">
                  <SelectValue placeholder="Select resource type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="worksheet">Worksheet</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="quiz">Quiz/Test</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="file">Upload File</Label>
              <div className="border border-dashed rounded-lg p-6 text-center">
                <Input 
                  type="file" 
                  id="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  required
                />
                <Label htmlFor="file" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <p className="font-medium">{file ? file.name : "Click to upload a file"}</p>
                    {file ? (
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    ) : (
                      <p className="text-xs text-gray-500">Upload PDF, Word, PowerPoint, or other teaching materials</p>
                    )}
                  </div>
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Upload Resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
