"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  BookOpen,
  Loader2,
  AlertCircle,
  BookText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModuleList } from "@/components/academic/module-list";
import { getSubjectsForDropdown, getSyllabusBySubject } from "@/lib/actions/syllabusActions";
import { getModulesBySyllabus } from "@/lib/actions/moduleActions";
import toast from "react-hot-toast";

function ModulesContent() {
  const searchParams = useSearchParams();
  const initialSubjectId = searchParams.get("subject");

  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || ""
  );
  const [currentSyllabus, setCurrentSyllabus] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchSyllabusAndModules(selectedSubjectId);
    } else {
      setCurrentSyllabus(null);
      setModules([]);
    }
  }, [selectedSubjectId]);

  async function fetchSubjects() {
    try {
      const result = await getSubjectsForDropdown();

      if (result.success) {
        setSubjects(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch subjects");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  async function fetchSyllabusAndModules(subjectId: string, showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      // Fetch syllabus
      const syllabusResult = await getSyllabusBySubject(subjectId);

      if (!syllabusResult.success) {
        setError(syllabusResult.error || "Failed to fetch syllabus");
        toast.error(syllabusResult.error || "Failed to fetch syllabus");
        setLoading(false);
        return;
      }

      const syllabus = syllabusResult.data;
      setCurrentSyllabus(syllabus);

      if (!syllabus) {
        setModules([]);
        return;
      }

      // Fetch modules
      const modulesResult = await getModulesBySyllabus(syllabus.id);

      if (modulesResult.success) {
        setModules(modulesResult.data || []);
      } else {
        setError(modulesResult.error || "Failed to fetch modules");
        toast.error(modulesResult.error || "Failed to fetch modules");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function handleRefresh() {
    if (selectedSubjectId) {
      await fetchSyllabusAndModules(selectedSubjectId, false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/academic/syllabus">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Syllabus
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Module Management
          </h1>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Subject</CardTitle>
          <CardDescription>
            Choose a subject to manage its syllabus modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label
                htmlFor="subject-select"
                className="text-sm font-medium block mb-1"
              >
                Subject
              </label>
              <Select
                value={selectedSubjectId}
                onValueChange={setSelectedSubjectId}
              >
                <SelectTrigger id="subject-select">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!selectedSubjectId && (
        <div className="text-center py-12 text-muted-foreground">
          <BookText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium mb-1">No Subject Selected</h3>
          <p className="text-sm">
            Please select a subject to view or manage modules
          </p>
        </div>
      )}

      {selectedSubjectId && loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {selectedSubjectId && !loading && !currentSyllabus && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium mb-1">No Syllabus Found</h3>
          <p className="text-sm mb-4">
            This subject doesn't have a syllabus yet. Please create a syllabus
            first.
          </p>
          <Link href="/admin/academic/syllabus">
            <Button>Go to Syllabus Management</Button>
          </Link>
        </div>
      )}

      {currentSyllabus && !loading && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    {currentSyllabus.title}
                  </CardTitle>
                  <CardDescription>
                    {currentSyllabus.description}
                  </CardDescription>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium">Subject:</span>{" "}
                    {currentSyllabus.subject?.name} (
                    {currentSyllabus.subject?.code})
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ModuleList
                modules={modules}
                syllabusId={currentSyllabus.id}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ModulesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ModulesContent />
    </Suspense>
  );
}
