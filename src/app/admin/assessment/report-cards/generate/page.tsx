"use client";

/**
 * Single Report Card Generation Page
 * 
 * Allows administrators to generate report cards for individual students
 * - Student and term selection
 * - Template selection dropdown
 * - Preview functionality
 * - PDF generation and download
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, FileText, Loader2, AlertCircle } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { GenerateReportCardDialog, BatchGenerateReportCardsDialog } from "@/components/admin/report-cards";
import {
  getStudentsForReportCard,
  getReportCardFilters,
} from "@/lib/actions/reportCardsActions";

export default function GenerateSingleReportCardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [canGenerate, setCanGenerate] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [studentsResult, filtersResult] = await Promise.all([
          getStudentsForReportCard(),
          getReportCardFilters(),
        ]);

        if (studentsResult.success && studentsResult.data) {
          setStudents(studentsResult.data);
        } else {
          setError(studentsResult.error || "Failed to fetch students");
        }

        if (filtersResult.success && filtersResult.data) {
          setTerms(filtersResult.data.terms);
          setClasses(filtersResult.data.classes || []);

          // Map sections with classId from the included class relation
          const mappedSections = (filtersResult.data.sections || []).map((section: any) => ({
            id: section.id,
            name: section.name,
            classId: section.classId,
          }));
          setSections(mappedSections);
        } else {
          setError(filtersResult.error || "Failed to fetch terms");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("An unexpected error occurred");
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const selectedTerm = terms.find((t) => t.id === selectedTermId);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/admin/assessment/report-cards">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Report Cards
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Generate Report Card
          </h1>
        </div>

        {/* Batch Generation Button */}
        {!loading && terms.length > 0 && classes.length > 0 && (
          <BatchGenerateReportCardsDialog
            classes={classes}
            sections={sections}
            termId={selectedTermId || terms[0]?.id || ""}
            termName={selectedTerm?.name || terms[0]?.name || ""}
          />
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Selection Form */}
        <Card>
          <CardHeader>
            <CardTitle>Select Student and Term</CardTitle>
            <CardDescription>
              Choose a student and academic term to generate their report card
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Student Selection */}
                <div className="space-y-2">
                  <Label htmlFor="student">Student</Label>
                  <Select
                    value={selectedStudentId}
                    onValueChange={setSelectedStudentId}
                  >
                    <SelectTrigger id="student">
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.length > 0 ? (
                        students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} ({student.admissionId})
                            {student.class && ` - ${student.class}`}
                            {student.section && ` ${student.section}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No students found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedStudent && (
                    <p className="text-sm text-muted-foreground">
                      Class: {selectedStudent.class} {selectedStudent.section}
                    </p>
                  )}
                </div>

                {/* Term Selection */}
                <div className="space-y-2">
                  <Label htmlFor="term">Academic Term</Label>
                  <Select
                    value={selectedTermId}
                    onValueChange={setSelectedTermId}
                  >
                    <SelectTrigger id="term">
                      <SelectValue placeholder="Select a term" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.length > 0 ? (
                        terms.map((term) => (
                          <SelectItem key={term.id} value={term.id}>
                            {term.name} ({term.academicYear.name})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No terms found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedTerm && (
                    <p className="text-sm text-muted-foreground">
                      Academic Year: {selectedTerm.academicYear.name}
                    </p>
                  )}
                </div>

                {/* Generate Button */}
                <div className="pt-4">
                  {canGenerate && selectedStudent && selectedTerm ? (
                    <GenerateReportCardDialog
                      studentId={selectedStudentId}
                      studentName={selectedStudent.name}
                      termId={selectedTermId}
                      termName={selectedTerm.name}
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
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Please select both a student and a term
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Information Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Report Card Generation</CardTitle>
            <CardDescription>
              How the report card generation process works
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">What gets included:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>All exam results for the selected term</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Subject-wise marks breakdown (theory, practical, internal)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Overall performance with grades and percentage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Attendance percentage for the term</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Co-scholastic activities and grades (if configured)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Teacher and principal remarks (if added)</span>
                </li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Generation steps:</h4>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-medium text-primary">1.</span>
                  <span>Select a report card template</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium text-primary">2.</span>
                  <span>Preview the report card data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium text-primary">3.</span>
                  <span>Generate the PDF document</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium text-primary">4.</span>
                  <span>Download or share the report card</span>
                </li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription className="text-sm">
                  Make sure all exam results have been entered and verified
                  before generating the report card. Generated report cards can
                  be regenerated if marks are updated.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
