"use client";


import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Clock, BookOpen, Layers, Plus, Loader2 } from "lucide-react";
import { createLesson, getSubjectSyllabusUnits } from "@/lib/actions/teacherLessonsActions";
import { getTeacherSubjects } from "@/lib/actions/teacherSubjectsActions";
import { toast } from "react-hot-toast";

function CreateLessonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSubjectId = searchParams.get("subject") || "";
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [resources, setResources] = useState("");
  const [duration, setDuration] = useState("45");
  const [selectedSubject, setSelectedSubject] = useState(initialSubjectId);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch subjects when the component mounts
  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoading(true);
      try {
        const response = await getTeacherSubjects();
        setSubjects(response.subjects);
        if (initialSubjectId && response.subjects.find(s => s.id === initialSubjectId)) {
          fetchUnits(initialSubjectId);
        }
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
        toast.error("Failed to load subjects");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, [initialSubjectId]);

  // Fetch syllabus units when subject changes
  const fetchUnits = async (subjectId: string) => {
    if (!subjectId) return;
    
    try {
      const response = await getSubjectSyllabusUnits(subjectId);
      setUnits(response.units);
    } catch (error) {
      console.error("Failed to fetch syllabus units:", error);
      toast.error("Failed to load syllabus units");
    }
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    setSelectedUnit("");
    fetchUnits(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("subjectId", selectedSubject);
      if (selectedUnit) formData.append("syllabusUnitId", selectedUnit);
      formData.append("content", content);
      formData.append("resources", resources);
      formData.append("duration", duration);

      const result = await createLesson(formData);

      if (result.success) {
        toast.success("Lesson created successfully!");
        router.push("/teacher/teaching/lessons");
      } else {
        toast.error(result.error || "Failed to create lesson");
      }
    } catch (error) {
      toast.error("Failed to create lesson");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Create New Lesson</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Lesson Details</CardTitle>
              <CardDescription>
                Basic information about the lesson
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Lesson Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a descriptive title for the lesson"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Brief Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief overview of the lesson content"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={selectedSubject}
                    onValueChange={handleSubjectChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Syllabus Unit</Label>
                  <Select
                    value={selectedUnit}
                    onValueChange={setSelectedUnit}
                    disabled={!selectedSubject || units.length === 0}
                  >
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Select a unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.title} ({unit.syllabusTitle})
                        </SelectItem>
                      ))}
                      {units.length === 0 && (
                        <SelectItem value="none" disabled>
                          No units available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    placeholder="Lesson duration in minutes"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Lesson Content</CardTitle>
              <CardDescription>
                The main content and materials for the lesson
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Lesson Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter the detailed content for the lesson"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resources">Resources (comma-separated URLs)</Label>
                <Textarea
                  id="resources"
                  placeholder="Enter URLs to external resources, separated by commas"
                  value={resources}
                  onChange={(e) => setResources(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedSubject}>
                {isSubmitting ? "Creating..." : "Create Lesson"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}


export default function CreateLessonPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CreateLessonContent />
    </Suspense>
  );
}

