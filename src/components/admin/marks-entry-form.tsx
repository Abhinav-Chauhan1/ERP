"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Loader2, AlertCircle, X } from "lucide-react";
import {
  getExamsForMarksEntry,
  getClassesForMarksEntry,
  getEnrolledStudentsForMarks,
  getTermsForMarksEntry,
  getExamTypesForMarksEntry,
  getSubjectsByClassForMarksEntry,
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
  classId: string;
  subject: { id: string; name: string };
  examType: { id: string; name: string; cbseComponent?: string | null };
  term: {
    id: string;
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

interface Term {
  id: string;
  name: string;
  academicYear: { name: string; isCurrent: boolean };
}

interface ExamType {
  id: string;
  name: string;
  cbseComponent?: string | null;
}

interface Subject {
  id: string;
  name: string;
  code?: string | null;
}

export function MarksEntryForm() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);

  // Filter state
  const [filterTermId, setFilterTermId] = useState<string>("");
  const [filterExamTypeId, setFilterExamTypeId] = useState<string>("");
  const [filterSubjectId, setFilterSubjectId] = useState<string>("");
  const [filterClassId, setFilterClassId] = useState<string>("");
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);

  // Selection state
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentsData, setStudentsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [examsResult, classesResult, termsResult, examTypesResult] =
        await Promise.all([
          getExamsForMarksEntry(),
          getClassesForMarksEntry(),
          getTermsForMarksEntry(),
          getExamTypesForMarksEntry(),
        ]);

      if (examsResult.success) setExams(examsResult.data || []);
      if (classesResult.success) setClasses(classesResult.data || []);
      if (termsResult.success) setTerms(termsResult.data || []);
      if (examTypesResult.success) setExamTypes(examTypesResult.data || []);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Load subjects when filter class changes
  useEffect(() => {
    setFilterSubjectId("");
    setFilteredSubjects([]);
    if (!filterClassId) return;
    getSubjectsByClassForMarksEntry(filterClassId).then((result) => {
      if (result.success) setFilteredSubjects(result.data || []);
    });
  }, [filterClassId]);

  // Filtered exams based on active filters
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      if (filterTermId && exam.term.id !== filterTermId) return false;
      if (filterExamTypeId && exam.examType.id !== filterExamTypeId) return false;
      if (filterSubjectId && exam.subject.id !== filterSubjectId) return false;
      if (filterClassId && exam.classId !== filterClassId) return false;
      return true;
    });
  }, [exams, filterTermId, filterExamTypeId, filterSubjectId, filterClassId]);

  // Reset exam selection when filters change
  useEffect(() => {
    setSelectedExamId("");
    setStudentsData(null);
  }, [filterTermId, filterExamTypeId, filterSubjectId, filterClassId]);

  const activeFilterCount = [filterTermId, filterExamTypeId, filterSubjectId, filterClassId].filter(Boolean).length;

  const clearFilters = () => {
    setFilterTermId("");
    setFilterExamTypeId("");
    setFilterSubjectId("");
    setFilterClassId("");
  };

  // Update sections when class changes
  useEffect(() => {
    if (selectedClassId) {
      const selectedClass = classes.find((c) => c.id === selectedClassId);
      setSections(selectedClass?.sections || []);
      setSelectedSectionId("");
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

  const selectedExam = filteredExams.find((e) => e.id === selectedExamId);
  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  const canLoadStudents =
    selectedExamId && selectedClassId && selectedSectionId && !isLoadingStudents;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Narrow down exams</p>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
              <X className="h-3 w-3" />
              Clear filters ({activeFilterCount})
            </Button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Term</Label>
            <Select value={filterTermId} onValueChange={setFilterTermId} disabled={isLoading}>
              <SelectTrigger className={filterTermId ? "border-primary" : ""}>
                <SelectValue placeholder="All terms" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    <div className="flex items-center gap-2">
                      <span>{term.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {term.academicYear.name}
                      </span>
                      {term.academicYear.isCurrent && (
                        <Badge variant="secondary" className="text-xs py-0">Current</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Exam Type</Label>
            <Select value={filterExamTypeId} onValueChange={setFilterExamTypeId} disabled={isLoading}>
              <SelectTrigger className={filterExamTypeId ? "border-primary" : ""}>
                <SelectValue placeholder="All exam types" />
              </SelectTrigger>
              <SelectContent>
                {examTypes.map((et) => (
                  <SelectItem key={et.id} value={et.id}>
                    <div className="flex items-center gap-2">
                      <span>{et.name}</span>
                      {et.cbseComponent && (
                        <Badge variant="outline" className="text-xs py-0 text-orange-700">
                          {et.cbseComponent}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Class</Label>
            <Select value={filterClassId} onValueChange={setFilterClassId} disabled={isLoading}>
              <SelectTrigger className={filterClassId ? "border-primary" : ""}>
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    <div className="flex items-center gap-2">
                      <span>{cls.name}</span>
                      {cls.academicYear.isCurrent && (
                        <Badge variant="secondary" className="text-xs py-0">Current</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Subject
              {!filterClassId && (
                <span className="ml-1 text-xs text-muted-foreground/60">(select class first)</span>
              )}
            </Label>
            <Select
              value={filterSubjectId}
              onValueChange={setFilterSubjectId}
              disabled={isLoading || !filterClassId}
            >
              <SelectTrigger className={filterSubjectId ? "border-primary" : ""}>
                <SelectValue placeholder={filterClassId ? "All subjects" : "Select class first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredSubjects.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    <span>{sub.name}</span>
                    {sub.code && (
                      <span className="ml-1 text-xs text-muted-foreground">({sub.code})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border-t" />

      {/* Selection Form */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="exam">
            Exam
            {filteredExams.length < exams.length && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({filteredExams.length} of {exams.length})
              </span>
            )}
          </Label>
          {isLoading ? (
            <div className="flex items-center justify-center h-10 border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger id="exam">
                <SelectValue placeholder={filteredExams.length === 0 ? "No exams match filters" : "Select exam"} />
              </SelectTrigger>
              <SelectContent>
                {filteredExams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    <div className="flex flex-col">
                      <span>{exam.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {exam.subject.name} · {exam.examType.name} · {exam.term.name}
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
          {isLoading ? (
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
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{selectedExam.examType.name}</p>
                {(selectedExam.examType as any).cbseComponent && (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 mt-1">
                    CBSE: {(selectedExam.examType as any).cbseComponent}
                  </Badge>
                )}
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
