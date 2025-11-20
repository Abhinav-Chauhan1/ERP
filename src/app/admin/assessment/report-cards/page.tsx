"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronLeft, Search, Download, FileText, 
  Printer, Mail, Eye, Filter, Loader2, 
  AlertCircle, CheckCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { format } from "date-fns";

// Import schema validation and server actions
import { reportCardRemarksSchema, ReportCardRemarksValues } from "@/lib/schemaValidation/reportCardsSchemaValidation";
import { 
  getReportCards, 
  getReportCardById, 
  getReportCardFilters,
  generateReportCard,
  updateReportCardRemarks,
  publishReportCard,
  calculateClassRanks,
  getStudentsForReportCard
} from "@/lib/actions/reportCardsActions";

export default function ReportCardsPage() {
  const [viewReportCardDialogOpen, setViewReportCardDialogOpen] = useState(false);
  const [addRemarksDialogOpen, setAddRemarksDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedReportCard, setSelectedReportCard] = useState<any>(null);
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [termFilter, setTermFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewTab, setViewTab] = useState("published");
  const [filterOptions, setFilterOptions] = useState<any>({
    terms: [],
    classes: []
  });
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const remarksForm = useForm<ReportCardRemarksValues>({
    resolver: zodResolver(reportCardRemarksSchema),
    defaultValues: {
      id: "",
      teacherRemarks: "",
      principalRemarks: "",
    },
  });

  const generateForm = useForm({
    defaultValues: {
      studentId: "",
      termId: "",
      sendNotification: false
    }
  });

  useEffect(() => {
    fetchReportCards();
    fetchFilterOptions();
  }, [viewTab]);

  async function fetchFilterOptions() {
    try {
      const result = await getReportCardFilters();
      
      if (result.success) {
        setFilterOptions(result.data);
      } else {
        toast.error(result.error || "Failed to fetch filter options");
      }
    } catch (err) {
      console.error("Error fetching filter options:", err);
      toast.error("An unexpected error occurred");
    }
  }

  async function fetchReportCards() {
    setLoading(true);
    setError(null);
    
    try {
      const published = viewTab === "published" ? true : 
                       viewTab === "draft" ? false : undefined;
      
      const result = await getReportCards({
        published,
        termId: termFilter !== "all" ? termFilter : undefined,
        classId: classFilter !== "all" ? classFilter : undefined
      });
      
      if (result.success) {
        setReportCards(result.data || []);
      } else {
        setError(result.error || "Failed to fetch report cards");
        toast.error(result.error || "Failed to fetch report cards");
      }
    } catch (err) {
      console.error("Error fetching report cards:", err);
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudents() {
    setLoadingStudents(true);
    try {
      const result = await getStudentsForReportCard();
      
      if (result.success) {
        setStudents(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch students");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoadingStudents(false);
    }
  }

  async function handleViewReportCard(id: string) {
    setDetailsLoading(true);
    setSelectedReportCard(null);
    
    try {
      const result = await getReportCardById(id);
      
      if (result.success) {
        setSelectedReportCard(result.data);
        setViewReportCardDialogOpen(true);
      } else {
        toast.error(result.error || "Failed to fetch report card details");
      }
    } catch (err) {
      console.error("Error fetching report card details:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setDetailsLoading(false);
    }
  }

  function handleAddRemarks(reportCard: any) {
    setSelectedReportCard(reportCard);
    remarksForm.reset({
      id: reportCard.id,
      teacherRemarks: reportCard.teacherRemarks || "",
      principalRemarks: reportCard.principalRemarks || "",
    });
    setAddRemarksDialogOpen(true);
  }

  async function handlePublishReportCard(id: string, sendNotification = false) {
    try {
      const result = await publishReportCard({
        id,
        sendNotification
      });
      
      if (result.success) {
        toast.success("Report card published successfully");
        fetchReportCards();
        setViewReportCardDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to publish report card");
      }
    } catch (err) {
      console.error("Error publishing report card:", err);
      toast.error("An unexpected error occurred");
    }
  }

  async function handleGenerateReportCard() {
    try {
      const values = generateForm.getValues();
      
      if (!values.studentId || !values.termId) {
        toast.error("Please select a student and term");
        return;
      }
      
      const result = await generateReportCard(values.studentId, values.termId);
      
      if (result.success) {
        toast.success("Report card generated successfully");
        setGenerateDialogOpen(false);
        generateForm.reset();
        fetchReportCards();
      } else {
        toast.error(result.error || "Failed to generate report card");
      }
    } catch (err) {
      console.error("Error generating report card:", err);
      toast.error("An unexpected error occurred");
    }
  }

  async function handleCalculateRanks() {
    if (termFilter === "all" || classFilter === "all") {
      toast.error("Please select both a term and a class to calculate ranks");
      return;
    }
    
    try {
      const result = await calculateClassRanks(termFilter, classFilter);
      
      if (result.success) {
        toast.success("Class ranks calculated successfully");
        fetchReportCards();
      } else {
        toast.error(result.error || "Failed to calculate ranks");
      }
    } catch (err) {
      console.error("Error calculating ranks:", err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleOpenGenerateDialog() {
    generateForm.reset({
      studentId: "",
      termId: "",
      sendNotification: false
    });
    fetchStudents();
    setGenerateDialogOpen(true);
  }

  async function onRemarksSubmit(values: ReportCardRemarksValues) {
    try {
      const result = await updateReportCardRemarks(values);
      
      if (result.success) {
        toast.success("Remarks updated successfully");
        setAddRemarksDialogOpen(false);
        fetchReportCards();
      } else {
        toast.error(result.error || "Failed to update remarks");
      }
    } catch (err) {
      console.error("Error updating remarks:", err);
      toast.error("An unexpected error occurred");
    }
  }

  // Filter report cards based on search and filters
  const filteredReportCards = reportCards.filter(rc => {
    if (statusFilter !== "all") {
      const isPublished = statusFilter === "published";
      if (rc.isPublished !== isPublished) return false;
    }
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      return (
        rc.studentName.toLowerCase().includes(lowerSearch) ||
        rc.studentAdmissionId.toLowerCase().includes(lowerSearch) ||
        rc.grade.toLowerCase().includes(lowerSearch)
      );
    }
    
    return true;
  });

  const publishedReportCards = filteredReportCards.filter(rc => rc.isPublished);
  const draftReportCards = filteredReportCards.filter(rc => !rc.isPublished);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/admin/assessment">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Report Cards</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenGenerateDialog}>
            <FileText className="mr-2 h-4 w-4" /> Generate Report Card
          </Button>
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

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="search" className="text-sm font-medium block mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="search" 
                  placeholder="Search by student name or ID..." 
                  className="pl-9" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="term-filter" className="text-sm font-medium block mb-1">Term</label>
              <Select value={termFilter} onValueChange={setTermFilter}>
                <SelectTrigger className="w-[180px]" id="term-filter">
                  <SelectValue placeholder="Filter by term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {filterOptions.terms.map((term: any) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name} ({term.academicYear.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="class-filter" className="text-sm font-medium block mb-1">Class</label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[180px]" id="class-filter">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {filterOptions.classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.academicYear.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="secondary" className="flex gap-2 items-center" onClick={fetchReportCards}>
              <Filter className="h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="published" value={viewTab} onValueChange={setViewTab}>
        <TabsList>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>

        <TabsContent value="published">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Published Report Cards</CardTitle>
              <CardDescription>
                Report cards that have been finalized and issued
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : publishedReportCards.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Student</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grade</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Term</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Result</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Issue Date</th>
                        <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {publishedReportCards.map((reportCard) => (
                        <tr key={reportCard.id} className="border-b">
                          <td className="py-3 px-4 align-middle">
                            <div className="font-medium">{reportCard.studentName}</div>
                            <div className="text-xs text-muted-foreground">{reportCard.studentAdmissionId}</div>
                          </td>
                          <td className="py-3 px-4 align-middle">{reportCard.grade} {reportCard.section}</td>
                          <td className="py-3 px-4 align-middle">{reportCard.term}</td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-1.5">
                              <Badge className={
                                reportCard.overallGrade?.startsWith('A') ? "bg-green-100 text-green-800" :
                                reportCard.overallGrade?.startsWith('B') ? "bg-primary/10 text-primary" :
                                reportCard.overallGrade?.startsWith('C') ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }>
                                {reportCard.overallGrade || "-"}
                              </Badge>
                              <span className="text-sm">
                                ({reportCard.percentage ? reportCard.percentage.toFixed(1) : "0"}%)
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {reportCard.publishDate && format(new Date(reportCard.publishDate), 'MMM d, yyyy')}
                          </td>
                          <td className="py-3 px-4 align-middle text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewReportCard(reportCard.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Mail className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No published report cards</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    No report cards have been published yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Draft Report Cards</CardTitle>
              <CardDescription>
                Report cards that are in preparation and not yet published
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : draftReportCards.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Student</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grade</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Term</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Result</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                        <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftReportCards.map((reportCard) => (
                        <tr key={reportCard.id} className="border-b">
                          <td className="py-3 px-4 align-middle">
                            <div className="font-medium">{reportCard.studentName}</div>
                            <div className="text-xs text-muted-foreground">{reportCard.studentAdmissionId}</div>
                          </td>
                          <td className="py-3 px-4 align-middle">{reportCard.grade} {reportCard.section}</td>
                          <td className="py-3 px-4 align-middle">{reportCard.term}</td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-1.5">
                              <Badge className={
                                reportCard.overallGrade?.startsWith('A') ? "bg-green-100 text-green-800" :
                                reportCard.overallGrade?.startsWith('B') ? "bg-primary/10 text-primary" :
                                reportCard.overallGrade?.startsWith('C') ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }>
                                {reportCard.overallGrade || "-"}
                              </Badge>
                              <span className="text-sm">
                                ({reportCard.percentage ? reportCard.percentage.toFixed(1) : "0"}%)
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <Badge className="bg-amber-100 text-amber-800">
                              Draft
                            </Badge>
                          </td>
                          <td className="py-3 px-4 align-middle text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewReportCard(reportCard.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleAddRemarks(reportCard)}
                            >
                              Add Remarks
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handlePublishReportCard(reportCard.id)}
                            >
                              Publish
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No draft report cards</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    All report cards have been published
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Report Card Dialog */}
      <Dialog open={viewReportCardDialogOpen} onOpenChange={setViewReportCardDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Report Card: {selectedReportCard?.studentName}</DialogTitle>
            <DialogDescription>
              {selectedReportCard?.grade} | {selectedReportCard?.section} | {selectedReportCard?.term}
            </DialogDescription>
          </DialogHeader>
          
          {detailsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedReportCard ? (
            <div className="max-h-[70vh] overflow-auto pr-2">
              <div className="border-b pb-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Student Information</h3>
                    <p className="font-medium text-lg">{selectedReportCard.studentName}</p>
                    <p className="text-sm">ID: {selectedReportCard.studentAdmissionId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Report Details</h3>
                    <p className="text-sm">Term: {selectedReportCard.term}</p>
                    <p className="text-sm">Academic Year: {selectedReportCard.academicYear}</p>
                    <p className="text-sm">Generated on: {
                      selectedReportCard.publishDate 
                      ? format(new Date(selectedReportCard.publishDate), 'MMM d, yyyy') 
                      : "Not issued yet"
                    }</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Performance Summary</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Overall Grade:</span>
                      <Badge className={
                        selectedReportCard.overallGrade?.startsWith('A') ? "bg-green-100 text-green-800" :
                        selectedReportCard.overallGrade?.startsWith('B') ? "bg-primary/10 text-primary" :
                        selectedReportCard.overallGrade?.startsWith('C') ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }>
                        {selectedReportCard.overallGrade || "-"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Overall Percentage</p>
                      <p className="text-2xl font-bold">{selectedReportCard.percentage?.toFixed(1) || "0"}%</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Class Rank</p>
                      <p className="text-2xl font-bold">{selectedReportCard.rank || "-"}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Attendance</p>
                      <p className="text-2xl font-bold">{selectedReportCard.attendance?.toFixed(1) || "0"}%</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Subject Results</h3>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-accent border-b">
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Subject</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Marks Obtained</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Maximum Marks</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Percentage</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReportCard.subjectResults?.length > 0 ? (
                          selectedReportCard.subjectResults.map((result: any) => (
                            <tr key={result.subjectId} className="border-b">
                              <td className="py-3 px-4 font-medium">{result.subject}</td>
                              <td className="py-3 px-4">{result.obtainedMarks.toFixed(1)}</td>
                              <td className="py-3 px-4">{result.totalMarks.toFixed(1)}</td>
                              <td className="py-3 px-4">{result.percentage.toFixed(1)}%</td>
                              <td className="py-3 px-4">
                                <Badge className={
                                  result.grade.startsWith('A') ? "bg-green-100 text-green-800" :
                                  result.grade.startsWith('B') ? "bg-primary/10 text-primary" :
                                  result.grade.startsWith('C') ? "bg-yellow-100 text-yellow-800" :
                                  "bg-red-100 text-red-800"
                                }>
                                  {result.grade}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-4 px-4 text-center text-muted-foreground">
                              No subject results found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Teacher's Remarks</h3>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm">
                        {selectedReportCard.teacherRemarks || "No remarks provided."}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Principal's Remarks</h3>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm">
                        {selectedReportCard.principalRemarks || "No remarks provided."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No details available
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewReportCardDialogOpen(false)}>
              Close
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print Report Card
            </Button>
            {selectedReportCard && !selectedReportCard.isPublished && (
              <Button onClick={() => handlePublishReportCard(selectedReportCard.id)}>
                Publish
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Remarks Dialog */}
      <Dialog open={addRemarksDialogOpen} onOpenChange={setAddRemarksDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Remarks</DialogTitle>
            <DialogDescription>
              Add teacher and principal remarks for {selectedReportCard?.studentName}
            </DialogDescription>
          </DialogHeader>
          <Form {...remarksForm}>
            <form onSubmit={remarksForm.handleSubmit(onRemarksSubmit)} className="space-y-4">
              <FormField
                control={remarksForm.control}
                name="teacherRemarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teacher's Remarks</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Comments on student's performance, areas of improvement, etc."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={remarksForm.control}
                name="principalRemarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principal's Remarks</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Principal's comments and recommendations"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddRemarksDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Remarks
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Generate Report Card Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Report Card</DialogTitle>
            <DialogDescription>
              Generate a new report card from existing exam results
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label htmlFor="studentId" className="text-sm font-medium">Student</label>
              <Select 
                onValueChange={(value) => generateForm.setValue("studentId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {loadingStudents ? (
                    <SelectItem value="loading" disabled>
                      <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                      Loading students...
                    </SelectItem>
                  ) : students.length > 0 ? (
                    students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.admissionId})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No students found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="termId" className="text-sm font-medium">Term</label>
              <Select 
                onValueChange={(value) => generateForm.setValue("termId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a term" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.terms.length > 0 ? (
                    filterOptions.terms.map((term: any) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name} ({term.academicYear.name})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No terms found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sendNotification" 
                checked={generateForm.watch("sendNotification")}
                onCheckedChange={(checked) => 
                  generateForm.setValue("sendNotification", checked as boolean)
                }
              />
              <label
                htmlFor="sendNotification"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Send notification to student and parents
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateReportCard}
              disabled={!generateForm.watch("studentId") || !generateForm.watch("termId")}
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}