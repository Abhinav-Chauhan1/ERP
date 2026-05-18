"use client";

import { useState, useEffect, useMemo } from "react";
import { FileText, Loader2, AlertCircle, GraduationCap, BookOpen, ClipboardList, Filter, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { GenerateReportCardDialog, BatchGenerateReportCardsDialog } from "@/components/admin/report-cards";
import {
  getStudentsForReportCard,
  getReportCardFilters,
  getExamTypesForTerm,
  calculateClassRanks,
} from "@/lib/actions/reportCardsActions";
import { getAcademicYearsForDropdown } from "@/lib/actions/termsActions";
import toast from "react-hot-toast";

type ReportMode = "term" | "cbse" | "examtype";

export default function ReportCardsPage() {
  const { toast: uiToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<ReportMode>("term");

  const [filterClassId, setFilterClassId] = useState<string>("");
  const [filterSectionId, setFilterSectionId] = useState<string>("");
  const [filterAcademicYearId, setFilterAcademicYearId] = useState<string>("");

  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>("");

  // Exam-type mode state
  const [examTypes, setExamTypes] = useState<{ id: string; name: string }[]>([]);
  const [examTypesLoading, setExamTypesLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [studentsResult, filtersResult, yearsResult] = await Promise.all([
          getStudentsForReportCard(),
          getReportCardFilters(),
          getAcademicYearsForDropdown(),
        ]);

        if (studentsResult.success && studentsResult.data) {
          setAllStudents(studentsResult.data);
        } else {
          setError(studentsResult.error || "Failed to fetch students");
        }

        if (filtersResult.success && filtersResult.data) {
          setTerms(filtersResult.data.terms);
          setClasses(filtersResult.data.classes || []);
          const mappedSections = (filtersResult.data.sections || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            classId: s.classId ?? s.class?.id,
          }));
          setSections(mappedSections);
        }

        if (yearsResult.success && yearsResult.data) {
          setAcademicYears(yearsResult.data);
          const current = yearsResult.data.find((y: any) => y.isCurrent);
          if (current) {
            setSelectedAcademicYearId(current.id);
            setFilterAcademicYearId(current.id);
          }
        }
      } catch {
        setError("An unexpected error occurred");
        uiToast({ title: "Error", description: "Failed to load data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [uiToast]);

  useEffect(() => {
    setFilterSectionId("");
    setSelectedStudentId("");
  }, [filterClassId]);

  useEffect(() => {
    setSelectedStudentId("");
  }, [filterSectionId]);

  useEffect(() => {
    if (mode !== "examtype" || !selectedTermId) {
      setExamTypes([]);
      return;
    }
    setExamTypesLoading(true);
    getExamTypesForTerm(selectedTermId).then((result) => {
      if (result.success && result.data) setExamTypes(result.data);
      setExamTypesLoading(false);
    });
  }, [mode, selectedTermId]);

  async function handleCalculateRanks() {
    if (!selectedTermId || !filterClassId || filterClassId === "all") {
      toast.error("Select a class and a term to calculate ranks");
      return;
    }
    try {
      const result = await calculateClassRanks(selectedTermId, filterClassId);
      if (result.success) {
        toast.success("Class ranks calculated successfully");
      } else {
        toast.error(result.error || "Failed to calculate ranks");
      }
    } catch {
      toast.error("An unexpected error occurred");
    }
  }

  const filteredSections = useMemo(
    () => (filterClassId && filterClassId !== "all" ? sections.filter((s) => s.classId === filterClassId) : sections),
    [sections, filterClassId],
  );

  const filteredTerms = useMemo(
    () =>
      filterAcademicYearId && filterAcademicYearId !== "all"
        ? terms.filter((t) => t.academicYear?.id === filterAcademicYearId)
        : terms,
    [terms, filterAcademicYearId],
  );

  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      if (filterClassId && filterClassId !== "all") {
        const classMatch = classes.find((c) => c.id === filterClassId);
        if (classMatch && s.class !== classMatch.name) return false;
      }
      if (filterSectionId && filterSectionId !== "all") {
        const sectionMatch = sections.find((sec) => sec.id === filterSectionId);
        if (sectionMatch && s.section !== sectionMatch.name) return false;
      }
      return true;
    });
  }, [allStudents, filterClassId, filterSectionId, classes, sections]);

  const selectedStudent =
    filteredStudents.find((s) => s.id === selectedStudentId) ??
    allStudents.find((s) => s.id === selectedStudentId);
  const selectedTerm = terms.find((t) => t.id === selectedTermId);
  const selectedYear = academicYears.find((y) => y.id === selectedAcademicYearId);

  const canGenerate =
    mode === "term"
      ? !!selectedStudentId && !!selectedTermId
      : mode === "examtype"
      ? !!selectedStudentId && !!selectedTermId
      : !!selectedStudentId && !!selectedAcademicYearId;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Report Cards</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {!loading && terms.length > 0 && classes.length > 0 && (
            <BatchGenerateReportCardsDialog
              classes={classes}
              sections={sections}
              termId={selectedTermId || terms[0]?.id || ""}
              termName={selectedTerm?.name || terms[0]?.name || ""}
              trigger={
                <Button variant="outline" className="gap-1.5">
                  <Users className="h-4 w-4" />
                  Batch Generate
                </Button>
              }
            />
          )}
          <Button variant="outline" onClick={handleCalculateRanks}>
            Calculate Ranks
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate Report Card</CardTitle>
            <CardDescription>Select report type, apply filters, then choose a student</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Report Type */}
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Tabs
                    value={mode}
                    onValueChange={(v) => {
                      setMode(v as ReportMode);
                      setSelectedStudentId("");
                      setSelectedTermId("");
                    }}
                  >
                    <TabsList className="w-full">
                      <TabsTrigger value="term" className="flex-1 gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        Term-Based
                      </TabsTrigger>
                      <TabsTrigger value="cbse" className="flex-1 gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" />
                        CBSE Annual
                      </TabsTrigger>
                      <TabsTrigger value="examtype" className="flex-1 gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5" />
                        By Exam Type
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {mode === "cbse" && (
                    <p className="text-xs text-muted-foreground">
                      Generates the full annual CBSE report card combining Term 1 &amp; Term 2 results.
                    </p>
                  )}
                  {mode === "examtype" && (
                    <p className="text-xs text-muted-foreground">
                      Generates a report card for a single exam type (e.g. Mid-Term, Final) within the selected term.
                    </p>
                  )}
                </div>

                {/* Filters */}
                <div className="rounded-md border p-3 space-y-3 bg-muted/30">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" />
                    Filters
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Academic Year</Label>
                    <Select
                      value={filterAcademicYearId}
                      onValueChange={(v) => {
                        setFilterAcademicYearId(v);
                        setSelectedAcademicYearId(v === "all" ? "" : v);
                        setSelectedTermId("");
                        setSelectedStudentId("");
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="All years" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All years</SelectItem>
                        {academicYears.map((y) => (
                          <SelectItem key={y.id} value={y.id}>
                            {y.name}
                            {y.isCurrent && (
                              <Badge variant="secondary" className="ml-2 text-xs py-0">Current</Badge>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Class</Label>
                      <Select value={filterClassId} onValueChange={setFilterClassId}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="All classes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All classes</SelectItem>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Section</Label>
                      <Select
                        value={filterSectionId}
                        onValueChange={setFilterSectionId}
                        disabled={!filterClassId || filterClassId === "all"}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="All sections" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All sections</SelectItem>
                          {filteredSections.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                </div>

                {/* Student Selection */}
                <div className="space-y-2">
                  <Label htmlFor="student">
                    Student
                    {filteredStudents.length !== allStudents.length && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({filteredStudents.length} of {allStudents.length})
                      </span>
                    )}
                  </Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger id="student">
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} ({student.admissionId})
                            {student.class && ` — ${student.class}`}
                            {student.section && ` ${student.section}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No students found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedStudent && (
                    <p className="text-xs text-muted-foreground">
                      Class: {selectedStudent.class} {selectedStudent.section}
                    </p>
                  )}
                </div>

                {/* Term Selection — term and examtype modes */}
                {(mode === "term" || mode === "examtype") && (
                  <div className="space-y-2">
                    <Label htmlFor="term">Academic Term</Label>
                    <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                      <SelectTrigger id="term">
                        <SelectValue placeholder="Select a term" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTerms.length > 0 ? (
                          filteredTerms.map((term) => (
                            <SelectItem key={term.id} value={term.id}>
                              {term.name} ({term.academicYear?.name})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No terms found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedTerm && (
                      <p className="text-xs text-muted-foreground">
                        Academic Year: {selectedTerm.academicYear?.name}
                      </p>
                    )}
                  </div>
                )}

                {/* Exam types available — examtype mode info */}
                {mode === "examtype" && selectedTermId && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Available Exam Types</Label>
                    {examTypesLoading ? (
                      <p className="text-xs text-muted-foreground">Loading exam types…</p>
                    ) : examTypes.length === 0 ? (
                      <p className="text-xs text-amber-600">No exam results found for this term.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {examTypes.map((et) => (
                          <Badge key={et.id} variant="secondary" className="text-xs">{et.name}</Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Choose an exam type inside the generation dialog.
                    </p>
                  </div>
                )}

                {/* Generate Button */}
                <div className="pt-2">
                  {canGenerate && selectedStudent ? (
                    <GenerateReportCardDialog
                      studentId={selectedStudentId}
                      studentName={selectedStudent.name}
                      termId={(mode === "term" || mode === "examtype") ? selectedTermId : undefined}
                      termName={(mode === "term" || mode === "examtype") ? selectedTerm?.name : undefined}
                      academicYearId={mode === "cbse" ? selectedAcademicYearId : undefined}
                      academicYearName={mode === "cbse" ? selectedYear?.name : undefined}
                      defaultMode={mode}
                      trigger={
                        <Button className="w-full" size="lg">
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Report Card
                        </Button>
                      }
                    />
                  ) : (
                    <Button className="w-full" size="lg" disabled>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report Card
                    </Button>
                  )}
                  {!canGenerate && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {mode === "term" || mode === "examtype"
                        ? "Please select a student and a term"
                        : "Please select a student and an academic year"}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Info Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Report Card Generation</CardTitle>
            <CardDescription>How the generation process works</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">What gets included:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {mode === "cbse" ? (
                  <>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Term 1 &amp; Term 2 results combined in CBSE format</span></li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Periodic Test, Multiple Assessment, Portfolio, Half-Yearly marks</span></li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Overall annual grade with CBSE grading scale (A1–E)</span></li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Co-scholastic activities and skill grades</span></li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Attendance, remarks, and promotion status</span></li>
                  </>
                ) : mode === "examtype" ? (
                  <>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Results for one specific exam type (e.g. Mid-Term, Final Exam)</span></li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Subject-wise marks for that exam type only</span></li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Overall performance with grades and percentage</span></li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Stored separately — does not overwrite term or annual cards</span></li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>All exam results for the selected term</span></li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Subject-wise marks breakdown (theory, practical, internal)</span></li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Overall performance with grades and percentage</span></li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Attendance percentage and teacher/principal remarks</span></li>
                  </>
                )}
              </ul>
            </div>

            <div className="border-t pt-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription className="text-sm">
                  Make sure all exam results have been entered and verified before generating.
                  Report cards can be regenerated any time if marks are updated.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
