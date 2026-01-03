"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  getExamsForMarksEntry,
  getClassesForMarksEntry,
  getEnrolledStudentsForMarks,
} from "@/lib/actions/marksEntryActions";
import { MarksEntryGrid } from "./marks-entry-grid";
import { Badge } from "@/components/ui/badge";
import { ImportMarksDialog } from "./import-marks-dialog";
import { ExportMarksDialog } from "./export-marks-dialog";

interface Exam {
  id: string;
  title: string;
  totalMarks: number;
  examDate: Date;
  subject: { name: string };
  examType: { name: string };
  term: {
    name: string;
    academicYear: { name: string };
  };
}

interface Class {
  id: string;
  name: string;
  sections: Section[];
  academicYear: {
    name: string;
    isCurrent: boolean;
  };
}

interface Section {
  id: string;
  name: string;
}

export function MarksEntryForm() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentsData, setStudentsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load exams and classes on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingExams(true);
      setIsLoadingClasses(true);

      const [examsResult, classesResult] = await Promise.all([
        getExamsForMarksEntry(),
        getClassesForMarksEntry(),
      ]);

      if (examsResult.success) {
        setExams(examsResult.data || []);
      }

      if (classesResult.success) {
        setClasses(classesResult.data || []);
      }

      setIsLoadingExams(false);
      setIsLoadingClasses(false);
    };

    loadData();
  }, []);

  // Update sections when class changes
  useEffect(() => {
    if (selectedClassId) {
      const selectedClass = classes.find((c) => c.id === selectedClassId);
      setSections(selectedClass?.sections || []);
      setSelectedSectionId(""); // Reset section selection
    } else {
      setSections([]);
      setSelectedSectionId("");
    }
  }, [selectedClassId, classes]);

  const handleLoadStudents = async () => {
    if (!selectedExamId || !selectedClassId || !selectedSectionId) {
      setError("Please select exam, class, and section");
      return;
    }

    setIsLoadingStudents(true);
    setError(null);
    setStudentsData(null);

    const result = await getEnrolledStudentsForMarks(
      selectedExamId,
      selectedClassId,
      selectedSectionId
    );

    setIsLoadingStudents(false);

    if (result.success) {
      if (result.data.students.length === 0) {
        setError("No students found for the selected class and section");
      } else {
        setStudentsData(result.data);
      }
    } else {
      setError(result.error || "Failed to load students");
    }
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  const canLoadStudents =
    selectedExamId && selectedClassId && selectedSectionId && !isLoadingStudents;

  return (
    <div className="space-y-6">
      {/* Selection Form */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="exam">Exam</Label>
          {isLoadingExams ? (
            <div className="flex items-center justify-center h-10 border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger id="exam">
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    <div className="flex flex-col">
                      <span>{exam.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {exam.subject.name} - {exam.examType.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="class">Class</Label>
          {isLoadingClasses ? (
            <div className="flex items-center justify-center h-10 border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger id="class">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    <div className="flex items-center gap-2">
                      <span>{cls.name}</span>
                      {cls.academicYear.isCurrent && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="section">Section</Label>
          <Select
            value={selectedSectionId}
            onValueChange={setSelectedSectionId}
            disabled={!selectedClassId || sections.length === 0}
          >
            <SelectTrigger id="section">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Load Button, Import, and Export */}
      <div className="flex justify-end gap-2">
        {selectedExamId && selectedClassId && selectedSectionId && studentsData && (
          <>
            <ImportMarksDialog
              examId={selectedExamId}
              subjectId={studentsData.exam.subjectId}
              onImportComplete={handleLoadStudents}
            />
            <ExportMarksDialog
              examId={selectedExamId}
              classId={selectedClassId}
              sectionId={selectedSectionId}
              examName={`${selectedExam?.title} - ${selectedClass?.name} ${selectedSection?.name}`}
            />
          </>
        )}
        <Button onClick={handleLoadStudents} disabled={!canLoadStudents}>
          {isLoadingStudents ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading Students...
            </>
          ) : (
            "Load Students"
          )}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Selected Details */}
      {selectedExam && selectedClass && selectedSection && !studentsData && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Exam</p>
                <p className="font-medium">{selectedExam.title}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedExam.subject.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-medium">{selectedClass.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Section</p>
                <p className="font-medium">{selectedSection.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Marks</p>
                <Badge variant="outline" className="font-medium">
                  {selectedExam.totalMarks}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marks Entry Grid */}
      {studentsData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">Enter Marks</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedExam?.title} - {selectedClass?.name} {selectedSection?.name}
                </p>
              </div>
              {!studentsData.markConfig && (
                <Alert variant="destructive" className="max-w-md">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    No mark configuration found for this exam. Please configure mark
                    components first.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {studentsData.markConfig ? (
              <MarksEntryGrid
                students={studentsData.students}
                examId={selectedExamId}
                subjectId={studentsData.exam.subjectId}
                markConfig={studentsData.markConfig}
                examTotalMarks={studentsData.exam.totalMarks}
              />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please configure mark components for this exam before entering marks.
                  Go to{" "}
                  <a
                    href={`/admin/assessment/subject-mark-config/${selectedExamId}`}
                    className="underline font-medium"
                  >
                    Subject Mark Configuration
                  </a>
                  .
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
