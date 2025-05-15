"use client";

import { useState } from "react";
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
import { SelectClass } from "@/components/forms/select-class";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload, PlusCircle, FileText } from "lucide-react";

// Example class data for selection
const teacherClasses = [
  { id: "1", name: "Grade 10-A", subject: "Mathematics" },
  { id: "2", name: "Grade 11-B", subject: "Mathematics" },
  { id: "3", name: "Grade 9-C", subject: "Mathematics" },
  { id: "4", name: "Grade 10-B", subject: "Mathematics" },
];

export default function CreateAssignmentPage() {
  const [selectedClass, setSelectedClass] = useState(teacherClasses[0]);
  const [assignedDate, setAssignedDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process form submission
    console.log("Assignment created!");
    
    // In a real app, this would call an API or server action
    // to create the assignment in the database
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
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
                <Input id="title" placeholder="Enter assignment title" required />
              </div>
              
              <div className="space-y-2">
                <Label>Select Class</Label>
                <SelectClass 
                  classes={teacherClasses}
                  selected={selectedClass}
                  onSelect={(cls) => setSelectedClass(cls)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total-marks">Total Marks</Label>
                <Input id="total-marks" type="number" min="0" placeholder="Enter total marks" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Assignment Category</Label>
                <Select defaultValue="homework">
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="practice">Practice</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                  </SelectContent>
                </Select>
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
              <Label htmlFor="content">Assignment Content</Label>
              <Textarea 
                id="content" 
                placeholder="Enter the details of the assignment..."
                rows={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="border border-dashed rounded-lg p-8 text-center">
                <Input 
                  type="file" 
                  id="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  multiple
                />
                <Label htmlFor="file" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-gray-400" />
                    <p className="font-medium">Click to upload files</p>
                    <p className="text-xs text-gray-500">
                      Upload PDF, Word, Excel, or image files
                    </p>
                  </div>
                </Label>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Selected Files:</p>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">({Math.round(file.size / 1024)} KB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button type="submit">Create Assignment</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
