"use client";

import { useState, useEffect, use } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, FileText, Clock, BookOpen, Layers, Save } from "lucide-react";
import { getTeacherLesson, updateLesson, getSubjectSyllabusUnits } from "@/lib/actions/teacherLessonsActions";
import { getTeacherSubjects } from "@/lib/actions/teacherSubjectsActions";
import { toast } from "react-hot-toast";

export default function EditLessonPage(props: { params: Promise<{ id: string }> }) {
  const paramsPromise = use(props.params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paramLessonId, setParamLessonId] = useState<string>("");

  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [resources, setResources] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  const [subjects, setSubjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Unwrap params
  useEffect(() => {
    paramsPromise.then(p => setParamLessonId(p.id));
  }, [paramsPromise]);

  // Fetch lesson data and subjects when the component mounts
  useEffect(() => {
    if (!paramLessonId) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch lesson details
        const lesson = await getTeacherLesson(paramLessonId);
        setLessonId(lesson.id);
        setTitle(lesson.title);
        setDescription(lesson.description || "");
        setContent(lesson.content || "");
        setResources(lesson.resources.join(",") || "");
        setDuration(lesson.duration.toString());
        setSelectedSubject(lesson.subjectId);
        if (lesson.unitId) setSelectedUnit(lesson.unitId);

        // Fetch subjects
        const { subjects } = await getTeacherSubjects();
        setSubjects(subjects);

        // Fetch units for the selected subject
        if (lesson.subjectId) {
          const { units } = await getSubjectSyllabusUnits(lesson.subjectId);
          setUnits(units);
        }
      } catch (error) {
        console.error("Failed to fetch lesson data:", error);
        toast.error("Failed to load lesson data");
        router.push("/teacher/teaching/lessons");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [paramLessonId, router]);

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

      const result = await updateLesson(lessonId, formData);

      if (result.success) {
        toast.success("Lesson updated successfully!");
        router.push(`/teacher/teaching/lessons/${lessonId}`);
      } else {
        toast.error(result.error || "Failed to update lesson");
      }
    } catch (error) {
      toast.error("Failed to update lesson");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href={`/teacher/teaching/lessons/${lessonId}`}>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex justify-between items-center flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Edit Lesson</h1>
        </div>
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
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
