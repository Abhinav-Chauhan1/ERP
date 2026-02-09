"use client";

import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { R2UploadWidget } from '@/components/upload/r2-upload-widget';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Clock,
  FileText,
  BookOpen,
  Layers,
  Edit,
  ArrowLeft,
  ExternalLink,
  ArrowUpRight,
  Save,
  X,
  Upload,
  FileUp,
  Paperclip
} from "lucide-react";
import { getTeacherLesson, updateLesson, getSubjectSyllabusUnits } from "@/lib/actions/teacherLessonsActions";
import { getTeacherSubjects } from "@/lib/actions/teacherSubjectsActions";
import { toast } from "react-hot-toast";
import { SafeHtmlRich } from "@/components/ui/safe-html";

export default function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const lessonId = React.use(params).id;

  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string, name: string }[]>([]);

  // Edit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [resources, setResources] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  // Fetch lesson data
  useEffect(() => {
    const fetchLesson = async () => {
      setIsLoading(true);
      try {
        const lessonData = await getTeacherLesson(lessonId);
        setLesson(lessonData);

        // Initialize form fields
        setTitle(lessonData.title);
        setDescription(lessonData.description || "");
        setContent(lessonData.content || "");
        setResources(Array.isArray(lessonData.resources) ? lessonData.resources.join(", ") : "");
        setDuration(lessonData.duration.toString());
        setSelectedSubject(lessonData.subjectId);
        setSelectedUnit(lessonData.unitId || "");

        // Identify existing Cloudinary resources
        if (Array.isArray(lessonData.resources)) {
          const cloudinaryFiles = lessonData.resources
            .filter((url: string) => url.includes('cloudinary.com'))
            .map((url: string, index: number) => ({
              url,
              name: `Document ${index + 1}`
            }));
          setUploadedFiles(cloudinaryFiles);
        }

        // Fetch subjects
        const subjectsData = await getTeacherSubjects();
        setSubjects(subjectsData.subjects);

        // Fetch units if we have a subject
        if (lessonData.subjectId) {
          const unitsData = await getSubjectSyllabusUnits(lessonData.subjectId);
          setUnits(unitsData.units);
        }
      } catch (error) {
        console.error("Failed to fetch lesson:", error);
        toast.error("Failed to load lesson data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  const handleSubjectChange = async (value: string) => {
    setSelectedSubject(value);
    setSelectedUnit("");

    try {
      const unitsData = await getSubjectSyllabusUnits(value);
      setUnits(unitsData.units);
    } catch (error) {
      console.error("Failed to fetch units:", error);
      toast.error("Failed to load syllabus units");
    }
  };

  const handleUploadSuccess = (result: any) => {
    const url = result.info.secure_url;
    const name = result.info.original_filename;
    setUploadedFiles(prev => [...prev, { url, name }]);
    toast.success("File uploaded successfully!");
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLesson = async () => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("subjectId", selectedSubject);
      if (selectedUnit) formData.append("syllabusUnitId", selectedUnit);
      formData.append("content", content);

      // Add uploaded document URLs to resources
      const textResources = resources.split(',').map(r => r.trim()).filter(Boolean);
      const cloudinaryUrls = uploadedFiles.map(file => file.url);
      const allResources = [...textResources, ...cloudinaryUrls].join(',');

      formData.append("resources", allResources);
      formData.append("duration", duration);

      const result = await updateLesson(lessonId, formData);

      if (result.success) {
        toast.success("Lesson updated successfully!");
        setIsEditing(false);

        // Refresh lesson data
        const updatedLesson = await getTeacherLesson(lessonId);
        setLesson(updatedLesson);

        router.refresh();
      } else {
        toast.error(result.error || "Failed to update lesson");
      }
    } catch (error) {
      console.error("Failed to update lesson:", error);
      toast.error("An error occurred while updating the lesson");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold">Lesson not found</h2>
        <p className="text-gray-500 mt-2">The lesson you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link href="/teacher/teaching/lessons">
          <Button variant="link" className="mt-4">Return to Lessons</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/teaching/lessons">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        <div className="flex justify-between items-center flex-1">
          <div>
            {!isEditing ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight">{lesson.title}</h1>
                <div className="flex items-center gap-2 text-gray-500">
                  <span>{lesson.subject}</span>
                  {lesson.unit !== "Not assigned" && (
                    <>
                      <span>•</span>
                      <span>{lesson.unit}</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <h1 className="text-2xl font-bold tracking-tight">Edit Lesson</h1>
            )}
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Link href={`/teacher/teaching/subjects/${lesson.subjectId}`}>
                  <Button variant="outline">
                    <BookOpen className="mr-2 h-4 w-4" /> View Subject
                  </Button>
                </Link>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Lesson
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleUpdateLesson} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Lesson Details</CardTitle>
            <CardDescription>Update the information for this lesson</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Lesson Title</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter lesson title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-subject">Subject</Label>
                <Select
                  value={selectedSubject}
                  onValueChange={handleSubjectChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="edit-subject">
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
                <Label htmlFor="edit-unit">Syllabus Unit</Label>
                <Select
                  value={selectedUnit}
                  onValueChange={setSelectedUnit}
                  disabled={!selectedSubject || units.length === 0 || isSubmitting}
                >
                  <SelectTrigger id="edit-unit">
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
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Duration in minutes"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the lesson"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Lesson Content</Label>
              <Textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Main lesson content"
                rows={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-resources">External Resources (comma-separated URLs)</Label>
              <Textarea
                id="edit-resources"
                value={resources}
                onChange={(e) => setResources(e.target.value)}
                placeholder="External resources URLs, separated by commas"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Upload Documents</Label>
              <div className="border border-dashed rounded-lg p-4">
                <R2UploadWidget
                  onSuccess={handleUploadSuccess}
                  accept={['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/*']}
                  maxSize={50 * 1024 * 1024} // 50MB
                  folder="lessons"
                  uploadText="Click to upload files"
                  descriptionText="Upload PDF, Word, Excel, PowerPoint, or image files"
                  multiple={true}
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Uploaded Documents</h4>
                  <ul className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {file.name}
                          </a>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Lesson Content</CardTitle>
                <CardDescription>Materials and information for teaching</CardDescription>
              </CardHeader>
              <CardContent className="prose max-w-none">
                {lesson.content ? (
                  <SafeHtmlRich 
                    content={lesson.content}
                    preserveLineBreaks
                  />
                ) : (
                  <p className="text-gray-500 italic">No content provided for this lesson.</p>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Lesson Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{lesson.duration} minutes</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Subject</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span>{lesson.subject}</span>
                    <Link href={`/teacher/teaching/subjects/${lesson.subjectId}`}>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Syllabus Unit</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Layers className="h-4 w-4 text-gray-400" />
                    <span>{lesson.unit}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>{new Date(lesson.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {lesson.resources && lesson.resources.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">External Resources</h3>
                    <ul className="space-y-2">
                      {lesson.resources.map((resource: string, index: number) => (
                        resource && (
                          <li key={index}>
                            <a
                              href={resource.startsWith('http') ? resource : `https://${resource}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              {resource.length > 40 ? `${resource.substring(0, 40)}...` : resource}
                            </a>
                          </li>
                        )
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Documents</h3>
                  <ul className="space-y-2">
                    {lesson.resources && lesson.resources.length > 0 && lesson.resources.map((resource: string, index: number) => {
                      if (resource.includes('cloudinary.com')) {
                        // This is a Cloudinary document
                        return (
                          <li key={index}>
                            <a
                              href={resource}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {`Document ${index + 1}`}
                            </a>
                          </li>
                        );
                      } else if (resource && resource.startsWith('http')) {
                        // This is an external URL
                        return (
                          <li key={index}>
                            <a
                              href={resource.startsWith('http') ? resource : `https://${resource}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              {resource.length > 40 ? `${resource.substring(0, 40)}...` : resource}
                            </a>
                          </li>
                        );
                      }
                      return null;
                    })}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {lesson.relatedLessons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related Lessons</CardTitle>
                <CardDescription>Other lessons in this subject</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {lesson.relatedLessons.map((relatedLesson: any) => (
                    <Link
                      key={relatedLesson.id}
                      href={`/teacher/teaching/lessons/${relatedLesson.id}`}
                      className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="font-medium">{relatedLesson.title}</h3>
                    </Link>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Link href="/teacher/teaching/lessons" className="w-full">
                  <Button variant="outline" className="w-full">
                    View All Lessons
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
