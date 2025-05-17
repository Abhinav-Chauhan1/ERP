"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar as CalendarIcon,
  ArrowLeft, 
  FileText, 
  Upload, 
  File, 
  X,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { getTeacherSubjects } from "@/lib/actions/teacherSubjectsActions"; 
import { getTeacherClasses, createAssignment } from "@/lib/actions/teacherAssignmentsActions";
import { toast } from "react-hot-toast";
import { CldUploadWidget } from "next-cloudinary";

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [assignedDate, setAssignedDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [totalMarks, setTotalMarks] = useState("100");
  const [instructions, setInstructions] = useState("");
  const [attachments, setAttachments] = useState<{name: string; url: string; size: number; type: string}[]>([]);
  
  // Options for selects
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch subjects
        const subjectsData = await getTeacherSubjects();
        setSubjects(subjectsData.subjects);
        
        // Fetch classes
        const classesData = await getTeacherClasses();
        setClasses(classesData.classes);
        
        // Set default values
        if (subjectsData.subjects.length > 0) {
          setSelectedSubject(subjectsData.subjects[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load required data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev => {
      if (prev.includes(classId)) {
        return prev.filter(id => id !== classId);
      } else {
        return [...prev, classId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assignedDate || !dueDate) {
      toast.error("Please select assigned and due dates");
      return;
    }
    
    if (selectedClasses.length === 0) {
      toast.error("Please select at least one class");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("subjectId", selectedSubject);
      selectedClasses.forEach(classId => formData.append("classIds", classId));
      formData.append("assignedDate", assignedDate.toISOString());
      formData.append("dueDate", dueDate.toISOString());
      formData.append("totalMarks", totalMarks);
      formData.append("instructions", instructions);
      formData.append("attachments", JSON.stringify(attachments));
      
      const response = await createAssignment(formData);
      
      if (response.success) {
        toast.success("Assignment created successfully");
        router.push('/teacher/assessments/assignments');
      } else {
        toast.error(response.error || "Failed to create assignment");
      }
    } catch (error) {
      console.error("Failed to create assignment:", error);
      toast.error("An error occurred while creating the assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadSuccess = (result: any) => {
    const fileInfo = {
      name: result.info.original_filename + '.' + result.info.format,
      url: result.info.secure_url,
      size: result.info.bytes,
      type: result.info.resource_type + '/' + result.info.format
    };
    
    setAttachments(prev => [...prev, fileInfo]);
    toast.success("File uploaded successfully");
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.push('/teacher/assessments/assignments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Create New Assignment</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Assignment Details</CardTitle>
              <CardDescription>Basic information about the assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Assignment Title</Label>
                <Input 
                  id="title" 
                  placeholder="Enter assignment title" 
                  required 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Brief description of the assignment"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={selectedSubject} 
                  onValueChange={setSelectedSubject}
                  required
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Classes</Label>
                <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                  {classes.length > 0 ? (
                    <div className="space-y-2">
                      {classes.map((cls) => (
                        <div key={cls.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`class-${cls.id}`} 
                            checked={selectedClasses.includes(cls.id)}
                            onCheckedChange={() => handleClassToggle(cls.id)}
                          />
                          <label 
                            htmlFor={`class-${cls.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {cls.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center">No classes available</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total-marks">Total Marks</Label>
                <Input 
                  id="total-marks" 
                  type="number" 
                  min="0" 
                  placeholder="Enter total marks" 
                  required 
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Dates & Instructions</CardTitle>
              <CardDescription>When the assignment is due and how to submit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Assigned Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {assignedDate ? format(assignedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={assignedDate}
                      onSelect={setAssignedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea 
                  id="instructions" 
                  placeholder="Provide detailed instructions for students"
                  rows={4}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Assignment Content & Attachments</CardTitle>
            <CardDescription>Upload files or create assignment content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="border border-dashed rounded-lg p-8 text-center">
                <CldUploadWidget 
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                  onSuccess={handleUploadSuccess}
                >
                  {({ open }) => (
                    <div 
                      onClick={() => open()}
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-10 w-10 text-gray-400" />
                      <p className="font-medium">Click to upload files</p>
                      <p className="text-xs text-gray-500">
                        Upload PDF, Word, Excel, or image files
                      </p>
                    </div>
                  )}
                </CldUploadWidget>
              </div>
              
              {attachments.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Uploaded Files:</p>
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">({Math.round(file.size / 1024)} KB)</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleRemoveAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/teacher/assessments/assignments')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Assignment"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
