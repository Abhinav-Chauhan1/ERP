"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { CldUploadWidget } from 'next-cloudinary';
import { 
  Clock, 
  Search, 
  Plus, 
  BookOpen, 
  FileText, 
  Calendar, 
  Layers,
  Eye,
  X,
  Save,
  Upload,
  FileUp,
  Paperclip
} from "lucide-react";
import { getTeacherLessons, getSubjectSyllabusUnits, createLesson } from "@/lib/actions/teacherLessonsActions";
import { getTeacherSubjects } from "@/lib/actions/teacherSubjectsActions";
import { toast } from "react-hot-toast";

export default function LessonsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subjectId = searchParams.get("subject");
  
  // State for lesson data
  const [lessons, setLessons] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [lessonsBySubject, setLessonsBySubject] = useState<Record<string, any[]>>({});
  const [recentLessons, setRecentLessons] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for create lesson form
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [resources, setResources] = useState("");
  const [duration, setDuration] = useState("45");
  const [selectedSubject, setSelectedSubject] = useState(subjectId || "");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [units, setUnits] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{url: string, name: string}[]>([]);
  
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch lessons
        const lessonsResponse = await getTeacherLessons(subjectId || undefined);
        setLessons(lessonsResponse.lessons);
        
        // Group lessons by subject
        const bySubject = lessonsResponse.lessons.reduce((acc: Record<string, any[]>, lesson: any) => {
          if (!acc[lesson.subjectId]) {
            acc[lesson.subjectId] = [];
          }
          acc[lesson.subjectId].push(lesson);
          return acc;
        }, {});
        setLessonsBySubject(bySubject);
        
        // Set recent lessons
        const recent = [...lessonsResponse.lessons].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 5);
        setRecentLessons(recent);
        
        // Fetch subjects
        const subjectsResponse = await getTeacherSubjects();
        setSubjects(subjectsResponse.subjects);
        
        // If subjectId is provided, set selected subject and fetch units
        if (subjectId) {
          setSelectedSubject(subjectId);
          fetchUnits(subjectId);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load data");
      }
    };
    
    fetchData();
  }, [subjectId]);
  
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
  
  const handleCreateLesson = async () => {
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("subjectId", selectedSubject);
      if (selectedUnit) formData.append("syllabusUnitId", selectedUnit);
      formData.append("content", content);
      
      const documentUrls = uploadedFiles.map(file => file.url).join(',');
      const combinedResources = [resources, documentUrls].filter(Boolean).join(',');
      formData.append("resources", combinedResources);
      
      formData.append("duration", duration);
      
      const result = await createLesson(formData);
      
      if (result.success) {
        toast.success("Lesson created successfully!");
        resetForm();
        setIsCreating(false);
        
        // Refresh data
        const lessonsResponse = await getTeacherLessons(subjectId || undefined);
        setLessons(lessonsResponse.lessons);
        
        const bySubject = lessonsResponse.lessons.reduce((acc: Record<string, any[]>, lesson: any) => {
          if (!acc[lesson.subjectId]) {
            acc[lesson.subjectId] = [];
          }
          acc[lesson.subjectId].push(lesson);
          return acc;
        }, {});
        setLessonsBySubject(bySubject);
        
        const recent = [...lessonsResponse.lessons].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 5);
        setRecentLessons(recent);
        
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create lesson");
      }
    } catch (error) {
      console.error("Failed to create lesson:", error);
      toast.error("An error occurred while creating the lesson");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setContent("");
    setResources("");
    setDuration("45");
    setSelectedUnit("");
    setUploadedFiles([]);
  };
  
  const toggleCreateForm = () => {
    setIsCreating(!isCreating);
    if (!isCreating && subjectId) {
      setSelectedSubject(subjectId);
      fetchUnits(subjectId);
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

  const filteredRecentLessons = recentLessons.filter(lesson => 
    lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lesson.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lesson.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Lessons</h1>
        <div className="flex gap-2">
          <div className="relative w-[250px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search lessons..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={toggleCreateForm}>
            {isCreating ? (
              <>
                <X className="mr-2 h-4 w-4" /> Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Create Lesson
              </>
            )}
          </Button>
        </div>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Lesson</CardTitle>
            <CardDescription>Fill in the details to create a new lesson</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={selectedSubject}
                  onValueChange={handleSubjectChange}
                  disabled={isSubmitting}
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

            <div className="space-y-2">
              <Label htmlFor="description">Brief Description</Label>
              <Textarea
                id="description"
                placeholder="Brief overview of the lesson content"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Lesson Content</Label>
              <Textarea
                id="content"
                placeholder="Enter the detailed content for the lesson"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resources">External Resources (comma-separated URLs)</Label>
              <Textarea
                id="resources"
                placeholder="Enter URLs to external resources, separated by commas"
                value={resources}
                onChange={(e) => setResources(e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Upload Documents</Label>
              <div className="border border-dashed rounded-lg p-4">
                <CldUploadWidget 
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                  onSuccess={handleUploadSuccess}
                >
                  {({ open }) => (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <FileUp className="h-10 w-10 text-gray-400" />
                      <p className="font-medium">Click to upload files</p>
                      <p className="text-xs text-gray-500 text-center">
                        Upload PDF, Word, Excel, PowerPoint, or image files
                      </p>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={() => open()}
                        className="mt-2"
                      >
                        <Upload className="mr-2 h-4 w-4" /> Upload Document
                      </Button>
                    </div>
                  )}
                </CldUploadWidget>
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
                            className="text-sm text-blue-600 hover:underline"
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
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={toggleCreateForm}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLesson} 
              disabled={isSubmitting || !title || !selectedSubject}
            >
              {isSubmitting ? (
                "Creating..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Create Lesson
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {!isCreating && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecentLessons.map((lesson) => (
              <Card key={lesson.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{lesson.title}</CardTitle>
                      <CardDescription>{lesson.subject}</CardDescription>
                    </div>
                    <Badge variant="outline">{new Date(lesson.createdAt).toLocaleDateString()}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-2">
                    {lesson.description || "No description provided"}
                  </p>
                  <div className="flex gap-3 mt-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{lesson.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Layers className="h-3 w-3" />
                      <span>{lesson.unit}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t pt-3 pb-3">
                  <Link href={`/teacher/teaching/lessons/${lesson.id}`} className="w-full">
                    <Button variant="ghost" className="w-full">
                      <Eye className="mr-2 h-4 w-4" /> View Lesson
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          <Tabs defaultValue={subjectId || subjects[0]?.id || "all"}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Subjects</TabsTrigger>
              {subjects.map((subject) => (
                <TabsTrigger key={subject.id} value={subject.id}>
                  {subject.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <div className="space-y-6">
                {Object.entries(lessonsBySubject).map(([subjectId, subjectLessons]) => {
                  const subject = subjects.find(s => s.id === subjectId);
                  return (
                    <Card key={subjectId}>
                      <CardHeader>
                        <CardTitle>{subject?.name || "Unknown Subject"}</CardTitle>
                        <CardDescription>{subjectLessons.length} lessons</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {subjectLessons.map((lesson) => (
                                <tr key={lesson.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium">{lesson.title}</div>
                                    <div className="text-xs text-gray-500">{lesson.description.substring(0, 60)}{lesson.description.length > 60 ? '...' : ''}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {lesson.unit}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {lesson.duration} minutes
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {new Date(lesson.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <Link href={`/teacher/teaching/lessons/${lesson.id}`}>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4 mr-1" /> View
                                      </Button>
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {subjects.map((subject) => (
              <TabsContent key={subject.id} value={subject.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>{subject.name}</CardTitle>
                    <CardDescription>
                      {lessonsBySubject[subject.id]?.length || 0} lessons available
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {lessonsBySubject[subject.id] && lessonsBySubject[subject.id].length > 0 ? (
                      <div className="rounded-md border overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {lessonsBySubject[subject.id].map((lesson) => (
                              <tr key={lesson.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-medium">{lesson.title}</div>
                                  <div className="text-xs text-gray-500">{lesson.description.substring(0, 60)}{lesson.description.length > 60 ? '...' : ''}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {lesson.unit}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {lesson.duration} minutes
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {new Date(lesson.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <Link href={`/teacher/teaching/lessons/${lesson.id}`}>
                                    <Button variant="ghost" size="sm">
                                      <Eye className="h-4 w-4 mr-1" /> View
                                    </Button>
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-lg font-medium">No Lessons Yet</h3>
                        <p className="mt-1 text-gray-500">Create your first lesson for this subject</p>
                        <Link href={`/teacher/teaching/lessons/create?subject=${subject.id}`} className="mt-4 inline-block">
                          <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Lesson
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                  {lessonsBySubject[subject.id] && lessonsBySubject[subject.id].length > 0 && (
                    <CardFooter className="flex justify-center border-t pt-4">
                      <Link href={`/teacher/teaching/lessons/create?subject=${subject.id}`}>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" /> Create New Lesson
                        </Button>
                      </Link>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
}
