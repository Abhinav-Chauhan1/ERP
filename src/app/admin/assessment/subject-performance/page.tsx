"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, Download, BarChart3, TrendingUp,
  TrendingDown, Loader2, AlertCircle, FileSpreadsheet
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import {
  getSubjectPerformanceReport,
  getSubjectPerformanceFilters,
  exportSubjectPerformanceToPDF,
  exportSubjectPerformanceToExcel
} from "@/lib/actions/subjectPerformanceActions";

interface SubjectStats {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  absentStudents: number;
  passPercentage: number;
  gradeDistribution: {
    grade: string;
    count: number;
    percentage: number;
  }[];
}

export default function SubjectPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<SubjectStats[]>([]);
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");
  const [filterOptions, setFilterOptions] = useState<any>({
    classes: [],
    sections: [],
    terms: []
  });

  const fetchFilterOptions = useCallback(async () => {
    try {
      const result = await getSubjectPerformanceFilters();

      if (result.success) {
        setFilterOptions(result.data);
      } else {
        toast.error(result.error || "Failed to fetch filter options");
      }
    } catch (err) {
      console.error("Error fetching filter options:", err);
      toast.error("An unexpected error occurred");
    }
  }, []);

  const fetchPerformanceData = useCallback(async () => {
    if (termFilter === "all") {
      // Don't show error on initial load or if explicitly cleared, just return
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getSubjectPerformanceReport({
        termId: termFilter,
        classId: classFilter !== "all" ? classFilter : undefined,
        sectionId: sectionFilter !== "all" ? sectionFilter : undefined
      });

      if (result.success) {
        setPerformanceData(result.data || []);
      } else {
        setError(result.error || "Failed to fetch performance data");
        toast.error(result.error || "Failed to fetch performance data");
      }
    } catch (err) {
      console.error("Error fetching performance data:", err);
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [termFilter, classFilter, sectionFilter]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    if (termFilter !== "all") {
      fetchPerformanceData();
    }
  }, [fetchPerformanceData, termFilter]);

  async function handleExportPDF() {
    if (termFilter === "all") {
      toast.error("Please select a term");
      return;
    }

    setExporting(true);
    try {
      const result = await exportSubjectPerformanceToPDF({
        termId: termFilter,
        classId: classFilter !== "all" ? classFilter : undefined,
        sectionId: sectionFilter !== "all" ? sectionFilter : undefined
      });

      if (result.success && result.data) {
        // Create a download link
        const link = document.createElement('a');
        link.href = result.data.url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("PDF exported successfully");
      } else {
        toast.error(result.error || "Failed to export PDF");
      }
    } catch (err) {
      console.error("Error exporting PDF:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportExcel() {
    if (termFilter === "all") {
      toast.error("Please select a term");
      return;
    }

    setExporting(true);
    try {
      const result = await exportSubjectPerformanceToExcel({
        termId: termFilter,
        classId: classFilter !== "all" ? classFilter : undefined,
        sectionId: sectionFilter !== "all" ? sectionFilter : undefined
      });

      if (result.success && result.data) {
        // Create a download link
        const link = document.createElement('a');
        link.href = result.data.url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Excel exported successfully");
      } else {
        toast.error(result.error || "Failed to export Excel");
      }
    } catch (err) {
      console.error("Error exporting Excel:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setExporting(false);
    }
  }

  // Update sections when class changes
  useEffect(() => {
    if (classFilter !== "all") {
      const selectedClass = filterOptions.classes.find((c: any) => c.id === classFilter);
      if (selectedClass) {
        setFilterOptions((prev: any) => ({
          ...prev,
          sections: selectedClass.sections || []
        }));
      }
    } else {
      setFilterOptions((prev: any) => ({
        ...prev,
        sections: []
      }));
      setSectionFilter("all");
    }
  }, [classFilter, filterOptions.classes]);

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
          <h1 className="text-2xl font-bold tracking-tight">Subject-wise Performance Reports</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={exporting || performanceData.length === 0}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={exporting || performanceData.length === 0}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Export Excel
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
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Select term, class, and section to view subject-wise performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="term-filter" className="text-sm font-medium block mb-1">
                Term <span className="text-red-500">*</span>
              </label>
              <Select value={termFilter} onValueChange={setTermFilter}>
                <SelectTrigger id="term-filter">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select a term</SelectItem>
                  {filterOptions.terms.map((term: any) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name} ({term.academicYear.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label htmlFor="class-filter" className="text-sm font-medium block mb-1">Class</label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger id="class-filter">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {filterOptions.classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label htmlFor="section-filter" className="text-sm font-medium block mb-1">Section</label>
              <Select
                value={sectionFilter}
                onValueChange={setSectionFilter}
                disabled={classFilter === "all"}
              >
                <SelectTrigger id="section-filter">
                  <SelectValue placeholder="Filter by section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {filterOptions.sections.map((section: any) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Data */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : performanceData.length > 0 ? (
        <div className="space-y-4">
          {performanceData.map((subject) => (
            <Card key={subject.subjectId}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{subject.subjectName}</CardTitle>
                    <CardDescription>Code: {subject.subjectCode}</CardDescription>
                  </div>
                  <Badge
                    className={
                      subject.passPercentage >= 80 ? "bg-green-100 text-green-800" :
                        subject.passPercentage >= 60 ? "bg-primary/10 text-primary" :
                          subject.passPercentage >= 40 ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                    }
                  >
                    {subject.passPercentage.toFixed(1)}% Pass Rate
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Average Marks</p>
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">{subject.averageMarks.toFixed(2)}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Highest Marks</p>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{subject.highestMarks.toFixed(2)}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Lowest Marks</p>
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">{subject.lowestMarks.toFixed(2)}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Total Students</p>
                    </div>
                    <p className="text-2xl font-bold">{subject.totalStudents}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {subject.passedStudents} passed, {subject.failedStudents} failed
                      {subject.absentStudents > 0 && `, ${subject.absentStudents} absent`}
                    </p>
                  </div>
                </div>

                {/* Grade Distribution */}
                <div>
                  <h4 className="font-medium mb-3">Grade Distribution</h4>
                  <div className="space-y-2">
                    {subject.gradeDistribution.map((grade) => (
                      <div key={grade.grade} className="flex items-center gap-3">
                        <div className="w-16 text-sm font-medium">
                          Grade {grade.grade}
                        </div>
                        <div className="flex-1">
                          <div className="relative h-8 bg-accent rounded-md overflow-hidden">
                            <div
                              className={`absolute inset-y-0 left-0 rounded-md ${grade.grade.startsWith('A') ? 'bg-green-500' :
                                grade.grade.startsWith('B') ? 'bg-blue-500' :
                                  grade.grade.startsWith('C') ? 'bg-yellow-500' :
                                    grade.grade.startsWith('D') ? 'bg-orange-500' :
                                      'bg-red-500'
                                }`}
                              style={{ width: `${grade.percentage}%` }}
                            />
                            <div className="absolute inset-0 flex items-center px-3">
                              <span className="text-sm font-medium">
                                {grade.count} students ({grade.percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No performance data available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {termFilter === "all"
                  ? "Please select a term to view performance reports"
                  : "No exam results found for the selected filters"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
