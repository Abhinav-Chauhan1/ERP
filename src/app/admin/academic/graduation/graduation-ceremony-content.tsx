"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronLeft, Loader2, GraduationCap, Calendar, MapPin, User, FileText, Send, Award, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getStudentsForGraduation,
  markStudentsAsGraduated,
  bulkGraduateClass,
  type GraduationCeremonyDetails,
} from "@/lib/actions/graduationActions";
import { getAcademicYears } from "@/lib/actions/academicyearsActions";
import { getClasses } from "@/lib/actions/classesActions";

interface GraduationCeremonyContentProps {
  userId: string;
}

interface StudentForGraduation {
  id: string;
  name: string;
  rollNumber: string | null;
  admissionId: string;
  class: string;
  section: string | null;
  alreadyGraduated: boolean;
}

export function GraduationCeremonyContent({ userId }: GraduationCeremonyContentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data for dropdowns
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  // Selection state
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  // Students data
  const [students, setStudents] = useState<StudentForGraduation[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Ceremony details
  const [graduationDate, setGraduationDate] = useState<Date>(new Date());
  const [venue, setVenue] = useState("");
  const [chiefGuest, setChiefGuest] = useState("");
  const [theme, setTheme] = useState("");
  const [notes, setNotes] = useState("");
  const [generateCertificates, setGenerateCertificates] = useState(true);
  const [sendNotifications, setSendNotifications] = useState(true);

  // Execution state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [executionResults, setExecutionResults] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setError(null);

    try {
      const [yearsResult, classesResult] = await Promise.all([
        getAcademicYears(),
        getClasses(),
      ]);

      if (yearsResult.success && yearsResult.data) {
        setAcademicYears(yearsResult.data);
      } else {
        throw new Error(yearsResult.error || "Failed to load academic years");
      }

      if (classesResult.success && classesResult.data) {
        setClasses(classesResult.data);
      } else {
        throw new Error(classesResult.error || "Failed to load classes");
      }
    } catch (err: any) {
      console.error("Error loading initial data:", err);
      setError(err.message || "Failed to load data");
      toast.error(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // Load students when class is selected
  async function loadStudents() {
    if (!selectedClassId || !selectedAcademicYearId) {
      toast.error("Please select academic year and class");
      return;
    }

    setLoadingStudents(true);
    setError(null);

    try {
      const result = await getStudentsForGraduation(
        selectedClassId,
        selectedSectionId || undefined,
        selectedAcademicYearId
      );

      if (result.success && result.data) {
        setStudents(result.data.students);
        // Auto-select eligible students (not already graduated)
        const eligibleIds = result.data.students
          .filter((s: StudentForGraduation) => !s.alreadyGraduated)
          .map((s: StudentForGraduation) => s.id);
        setSelectedStudentIds(eligibleIds);
      } else {
        throw new Error(result.error || "Failed to load students");
      }
    } catch (err: any) {
      console.error("Error loading students:", err);
      setError(err.message || "Failed to load students");
      toast.error(err.message || "Failed to load students");
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }

  // Handle select all
  function handleSelectAll(checked: boolean) {
    if (checked) {
      const eligibleIds = students
        .filter((s) => !s.alreadyGraduated)
        .map((s) => s.id);
      setSelectedStudentIds(eligibleIds);
    } else {
      setSelectedStudentIds([]);
    }
  }

  // Handle individual selection
  function handleStudentSelection(studentId: string, checked: boolean) {
    if (checked) {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    } else {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== studentId));
    }
  }

  // Handle graduation execution
  async function executeGraduation() {
    if (selectedStudentIds.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    setExecuting(true);
    setShowConfirmDialog(false);
    setError(null);

    try {
      const ceremonyDetails: GraduationCeremonyDetails = {
        ceremonyDate: graduationDate,
        venue: venue || undefined,
        chiefGuest: chiefGuest || undefined,
        theme: theme || undefined,
        notes: notes || undefined,
      };

      const result = await markStudentsAsGraduated({
        studentIds: selectedStudentIds,
        graduationDate,
        ceremonyDetails,
        generateCertificates,
        sendNotifications,
      });

      if (result.success && result.data) {
        setExecutionResults(result.data);
        setShowResultsDialog(true);

        if (result.data.failures.length === 0) {
          toast.success(`Successfully graduated ${result.data.graduatedCount} students`);
        } else {
          toast.error(`Graduation completed with ${result.data.failures.length} failures`);
        }

        // Reload students to reflect changes
        await loadStudents();
      } else {
        throw new Error(result.error || "Failed to execute graduation");
      }
    } catch (err: any) {
      console.error("Error executing graduation:", err);
      setError(err.message || "Failed to execute graduation");
      toast.error(err.message || "Failed to execute graduation");
    } finally {
      setExecuting(false);
    }
  }

  // Handle bulk graduation
  async function executeBulkGraduation() {
    if (!selectedClassId || !selectedAcademicYearId) {
      toast.error("Please select academic year and class");
      return;
    }

    setExecuting(true);
    setShowConfirmDialog(false);
    setError(null);

    try {
      const ceremonyDetails: GraduationCeremonyDetails = {
        ceremonyDate: graduationDate,
        venue: venue || undefined,
        chiefGuest: chiefGuest || undefined,
        theme: theme || undefined,
        notes: notes || undefined,
      };

      const result = await bulkGraduateClass({
        classId: selectedClassId,
        sectionId: selectedSectionId || undefined,
        academicYearId: selectedAcademicYearId,
        graduationDate,
        ceremonyDetails,
        generateCertificates,
        sendNotifications,
      });

      if (result.success && result.data) {
        setExecutionResults(result.data);
        setShowResultsDialog(true);

        if (result.data.failures.length === 0) {
          toast.success(`Successfully graduated ${result.data.graduatedCount} students`);
        } else {
          toast.error(`Graduation completed with ${result.data.failures.length} failures`);
        }

        // Reload students to reflect changes
        await loadStudents();
      } else {
        throw new Error(result.error || "Failed to execute bulk graduation");
      }
    } catch (err: any) {
      console.error("Error executing bulk graduation:", err);
      setError(err.message || "Failed to execute bulk graduation");
      toast.error(err.message || "Failed to execute bulk graduation");
    } finally {
      setExecuting(false);
    }
  }

  // Handle results dialog close
  function handleResultsClose() {
    setShowResultsDialog(false);
    setExecutionResults(null);
  }

  const eligibleStudents = students.filter((s) => !s.alreadyGraduated);
  const allEligibleSelected = eligibleStudents.length > 0 &&
    eligibleStudents.every((s) => selectedStudentIds.includes(s.id));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading graduation ceremony...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2">
        <Link href="/admin/academic">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">Graduation Ceremony</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Graduation Ceremony</h1>
          <p className="text-muted-foreground mt-1">
            Mark students as graduated and manage graduation ceremonies
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Selection and Ceremony Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Class Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Class</CardTitle>
              <CardDescription>
                Choose the class for graduation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Select
                  value={selectedAcademicYearId}
                  onValueChange={(value) => {
                    setSelectedAcademicYearId(value);
                    setStudents([]);
                    setSelectedStudentIds([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={selectedClassId}
                  onValueChange={(value) => {
                    const selectedClass = classes.find((c) => c.id === value);
                    setSelectedClassId(value);
                    setSections(selectedClass?.sections || []);
                    setSelectedSectionId("");
                    setStudents([]);
                    setSelectedStudentIds([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {sections.length > 0 && (
                <div className="space-y-2">
                  <Label>Section (Optional)</Label>
                  <Select
                    value={selectedSectionId || "all"}
                    onValueChange={(value) => {
                      setSelectedSectionId(value === "all" ? "" : value);
                      setStudents([]);
                      setSelectedStudentIds([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={loadStudents}
                disabled={!selectedClassId || !selectedAcademicYearId || loadingStudents}
                className="w-full"
              >
                {loadingStudents ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Students...
                  </>
                ) : (
                  "Load Students"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Ceremony Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ceremony Details</CardTitle>
              <CardDescription>
                Add graduation ceremony information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Graduation Date</Label>
                <DatePicker
                  date={graduationDate}
                  onSelect={(date) => date && setGraduationDate(date)}
                />
              </div>

              <div className="space-y-2">
                <Label>Venue</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="School Auditorium"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Chief Guest</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Guest name"
                    value={chiefGuest}
                    onChange={(e) => setChiefGuest(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Theme</Label>
                <Input
                  placeholder="Ceremony theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="certificates"
                    checked={generateCertificates}
                    onCheckedChange={(checked) => setGenerateCertificates(checked as boolean)}
                  />
                  <Label htmlFor="certificates" className="text-sm font-normal cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Generate graduation certificates
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifications"
                    checked={sendNotifications}
                    onCheckedChange={(checked) => setSendNotifications(checked as boolean)}
                  />
                  <Label htmlFor="notifications" className="text-sm font-normal cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send congratulatory messages
                    </div>
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Student List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Students for Graduation</CardTitle>
                  <CardDescription>
                    Select students to mark as graduated
                  </CardDescription>
                </div>
                {students.length > 0 && (
                  <Badge variant="secondary">
                    {selectedStudentIds.length} of {eligibleStudents.length} selected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingStudents ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading students...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                  <GraduationCap className="h-12 w-12 text-muted-foreground/50" />
                  <div>
                    <p className="font-medium">No students loaded</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select a class and click "Load Students" to begin
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select All */}
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Checkbox
                      id="select-all"
                      checked={allEligibleSelected}
                      onCheckedChange={handleSelectAll}
                      disabled={eligibleStudents.length === 0}
                    />
                    <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      Select All Eligible Students
                    </Label>
                  </div>

                  {/* Student Table */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Admission ID</TableHead>
                          <TableHead>Roll No.</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedStudentIds.includes(student.id)}
                                onCheckedChange={(checked) =>
                                  handleStudentSelection(student.id, checked as boolean)
                                }
                                disabled={student.alreadyGraduated}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.admissionId}</TableCell>
                            <TableCell>{student.rollNumber || "-"}</TableCell>
                            <TableCell>
                              {student.alreadyGraduated ? (
                                <Badge variant="secondary">Already Graduated</Badge>
                              ) : (
                                <Badge variant="outline">Eligible</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={selectedStudentIds.length === 0 || executing}
                    >
                      Graduate Selected Students
                    </Button>
                    <Button
                      onClick={() => {
                        // Select all eligible and show confirm
                        const eligibleIds = students
                          .filter((s) => !s.alreadyGraduated)
                          .map((s) => s.id);
                        setSelectedStudentIds(eligibleIds);
                        setShowConfirmDialog(true);
                      }}
                      disabled={eligibleStudents.length === 0 || executing}
                    >
                      Graduate Entire Class
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Graduation</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark {selectedStudentIds.length} student(s) as graduated?
              This action will:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Update enrollment status to GRADUATED</p>
                <p className="text-sm text-muted-foreground">
                  Students will no longer have active enrollments
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Create alumni profiles</p>
                <p className="text-sm text-muted-foreground">
                  Students will be added to the alumni database
                </p>
              </div>
            </div>
            {generateCertificates && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Generate graduation certificates</p>
                  <p className="text-sm text-muted-foreground">
                    Certificates will be created for all students
                  </p>
                </div>
              </div>
            )}
            {sendNotifications && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Send congratulatory messages</p>
                  <p className="text-sm text-muted-foreground">
                    Students and parents will receive notifications
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={executing}
            >
              Cancel
            </Button>
            <Button
              onClick={executeGraduation}
              disabled={executing}
            >
              {executing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Graduation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Graduation Results</DialogTitle>
            <DialogDescription>
              Summary of the graduation ceremony
            </DialogDescription>
          </DialogHeader>
          {executionResults && (
            <div className="space-y-4 py-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {executionResults.graduatedCount}
                      </p>
                      <p className="text-sm text-muted-foreground">Graduated</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {executionResults.alumniCreated}
                      </p>
                      <p className="text-sm text-muted-foreground">Alumni Created</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {executionResults.certificatesGenerated}
                      </p>
                      <p className="text-sm text-muted-foreground">Certificates</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {executionResults.notificationsSent}
                      </p>
                      <p className="text-sm text-muted-foreground">Notifications</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Failures */}
              {executionResults.failures && executionResults.failures.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-destructive">
                    Failed Graduations ({executionResults.failures.length})
                  </h4>
                  <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {executionResults.failures.map((failure: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{failure.studentName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {failure.reason}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleResultsClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
