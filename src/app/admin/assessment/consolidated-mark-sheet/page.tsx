"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, Download, FileSpreadsheet,
  Printer, AlertCircle, Loader2, Filter, FileText
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { exportToExcel } from "@/lib/utils/excel";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  getConsolidatedMarkSheet,
  getConsolidatedMarkSheetFilters,
  exportConsolidatedMarkSheetCSV,
  getConsolidatedMarkSheetForExcel,
  type StudentMarkData
} from "@/lib/actions/consolidatedMarkSheetActions";

export default function ConsolidatedMarkSheetPage() {
  const [loading, setLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [termFilter, setTermFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [examFilter, setExamFilter] = useState("");

  // Filter options
  const [filterOptions, setFilterOptions] = useState<any>({
    terms: [],
    classes: [],
    sections: [],
    exams: []
  });

  // Data
  const [markSheetData, setMarkSheetData] = useState<{
    students: StudentMarkData[];
    subjects: { id: string; name: string }[];
    totalStudents: number;
  } | null>(null);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  async function fetchFilterOptions() {
    setFiltersLoading(true);
    try {
      const result = await getConsolidatedMarkSheetFilters();

      if (result.success) {
        setFilterOptions(result.data);
      } else {
        toast.error(result.error || "Failed to fetch filter options");
      }
    } catch (err) {
      console.error("Error fetching filter options:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setFiltersLoading(false);
    }
  }

  async function handleFetchMarkSheet() {
    if (!classFilter || !sectionFilter) {
      toast.error("Please select both class and section");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getConsolidatedMarkSheet({
        classId: classFilter,
        sectionId: sectionFilter,
        termId: termFilter || undefined,
        examId: examFilter || undefined
      });

      if (result.success && result.data) {
        setMarkSheetData(result.data);

        if (result.data.students.length === 0) {
          toast.error("No students found for the selected filters");
        }
      } else {
        setError(result.error || "Failed to fetch mark sheet");
        toast.error(result.error || "Failed to fetch mark sheet");
      }
    } catch (err) {
      console.error("Error fetching mark sheet:", err);
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCSV() {
    if (!classFilter || !sectionFilter) {
      toast.error("Please select both class and section");
      return;
    }

    try {
      const result = await exportConsolidatedMarkSheetCSV({
        classId: classFilter,
        sectionId: sectionFilter,
        termId: termFilter || undefined,
        examId: examFilter || undefined
      });

      if (result.success && result.data) {
        // Create a blob and download
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `consolidated-mark-sheet-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success("Mark sheet exported successfully");
      } else {
        toast.error(result.error || "Failed to export mark sheet");
      }
    } catch (err) {
      console.error("Error exporting mark sheet:", err);
      toast.error("An unexpected error occurred");
    }
  }

  async function handleExportExcel() {
    if (!classFilter || !sectionFilter) {
      toast.error("Please select both class and section");
      return;
    }

    try {
      const result = await getConsolidatedMarkSheetForExcel({
        classId: classFilter,
        sectionId: sectionFilter,
        termId: termFilter || undefined,
        examId: examFilter || undefined
      });

      if (result.success && result.data) {
        const { headerRow2, dataRows, subjects } = result.data;

        // Flatten data for simple export
        const exportData = dataRows.map((row: any[]) => {
          const obj: any = {
            'Roll No': row[0],
            'Admission ID': row[1],
            'Student Name': row[2],
          };

          // Add subject marks
          let colIndex = 3;
          subjects.forEach((subject: string) => {
            obj[`${subject} - Theory`] = row[colIndex++] || '';
            obj[`${subject} - Practical`] = row[colIndex++] || '';
            obj[`${subject} - Internal`] = row[colIndex++] || '';
            obj[`${subject} - Total`] = row[colIndex++] || '';
            obj[`${subject} - Grade`] = row[colIndex++] || '';
          });

          obj['Overall Total'] = row[colIndex++] || '';
          obj['Overall %'] = row[colIndex++] || '';
          obj['Overall Grade'] = row[colIndex] || '';

          return obj;
        });

        // Use ExcelJS for export
        await exportToExcel(exportData, {
          filename: `consolidated-mark-sheet-${Date.now()}`,
          title: 'Consolidated Mark Sheet',
          subtitle: `Class: ${classFilter} | Section: ${sectionFilter}`,
          includeTimestamp: true,
        });

        toast.success("Mark sheet exported successfully");
      } else {
        toast.error(result.error || "Failed to export mark sheet");
      }
    } catch (err) {
      console.error("Error exporting Excel:", err);
      toast.error("An unexpected error occurred");
    }
  }

  async function handleExportPDF() {
    if (!markSheetData) {
      toast.error("No data to export");
      return;
    }

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');

      // Add title
      doc.setFontSize(16);
      doc.text('Consolidated Mark Sheet', 14, 15);

      // Prepare table headers
      const headers = [
        [
          { content: 'Roll No', rowSpan: 2 },
          { content: 'Student Name', rowSpan: 2 },
          ...markSheetData.subjects.flatMap(subject => [
            { content: subject.name, colSpan: 5 }
          ]),
          { content: 'Total', rowSpan: 2 },
          { content: '%', rowSpan: 2 },
          { content: 'Grade', rowSpan: 2 }
        ],
        [
          ...markSheetData.subjects.flatMap(() => ['Th', 'Pr', 'Int', 'Tot', 'Gr'])
        ]
      ];

      // Prepare table body
      const body = markSheetData.students.map(student => {
        const subjectData = markSheetData.subjects.flatMap(subject => {
          const subjectResult = student.subjects.find(s => s.subjectId === subject.id);

          if (!subjectResult) {
            return ['-', '-', '-', '-', '-'];
          }

          if (subjectResult.isAbsent) {
            return ['AB', 'AB', 'AB', 'AB', 'AB'];
          }

          return [
            subjectResult.theoryMarks?.toFixed(1) ?? '-',
            subjectResult.practicalMarks?.toFixed(1) ?? '-',
            subjectResult.internalMarks?.toFixed(1) ?? '-',
            subjectResult.totalMarks?.toFixed(1) ?? '-',
            subjectResult.grade ?? '-'
          ];
        });

        return [
          student.rollNumber || '-',
          student.studentName,
          ...subjectData,
          student.overallTotal.toFixed(1),
          student.overallPercentage.toFixed(1),
          student.overallGrade || '-'
        ];
      });

      // Generate table
      autoTable(doc, {
        head: headers,
        body: body,
        startY: 20,
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [66, 139, 202], halign: 'center' },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 40 }
        },
        didDrawPage: (data) => {
          // Footer
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
      });

      doc.save(`consolidated-mark-sheet-${Date.now()}.pdf`);
      toast.success("PDF exported successfully");
    } catch (err) {
      console.error("Error exporting PDF:", err);
      toast.error("An unexpected error occurred");
    }
  }

  function handlePrint() {
    window.print();
  }

  // Get filtered sections based on selected class
  const filteredSections = classFilter
    ? filterOptions.sections.filter((s: any) => s.classId === classFilter)
    : filterOptions.sections;

  // Get filtered exams based on selected term
  const filteredExams = termFilter
    ? filterOptions.exams.filter((e: any) => e.termId === termFilter)
    : filterOptions.exams;

  // Count incomplete entries
  const incompleteCount = markSheetData?.students.reduce((count, student) => {
    const hasIncomplete = student.subjects.some(s => s.isIncomplete);
    return count + (hasIncomplete ? 1 : 0);
  }, 0) || 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center print:hidden">
        <div className="flex items-center gap-2">
          <Link href="/admin/assessment">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Consolidated Mark Sheet</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={!markSheetData || loading}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!markSheetData || loading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={!markSheetData || loading}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={!markSheetData || loading}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="print:hidden">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Select Filters</CardTitle>
          <CardDescription>
            Choose class, section, and optionally term or specific exam
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label htmlFor="term-filter" className="text-sm font-medium block mb-1">
                Term (Optional)
              </label>
              <Select
                value={termFilter || "all"}
                onValueChange={(value) => setTermFilter(value === "all" ? "" : value)}
                disabled={filtersLoading}
              >
                <SelectTrigger id="term-filter">
                  <SelectValue placeholder="All Terms" />
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
              <label htmlFor="class-filter" className="text-sm font-medium block mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <Select
                value={classFilter}
                onValueChange={(value) => {
                  setClassFilter(value);
                  setSectionFilter(""); // Reset section when class changes
                }}
                disabled={filtersLoading}
              >
                <SelectTrigger id="class-filter">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.academicYear.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="section-filter" className="text-sm font-medium block mb-1">
                Section <span className="text-red-500">*</span>
              </label>
              <Select
                value={sectionFilter}
                onValueChange={setSectionFilter}
                disabled={filtersLoading || !classFilter}
              >
                <SelectTrigger id="section-filter">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSections.map((section: any) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="exam-filter" className="text-sm font-medium block mb-1">
                Exam (Optional)
              </label>
              <Select
                value={examFilter || "all"}
                onValueChange={(value) => setExamFilter(value === "all" ? "" : value)}
                disabled={filtersLoading}
              >
                <SelectTrigger id="exam-filter">
                  <SelectValue placeholder="All Exams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {filteredExams.map((exam: any) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title} - {exam.subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleFetchMarkSheet}
                disabled={loading || !classFilter || !sectionFilter}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Filter className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {markSheetData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{markSheetData.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{markSheetData.subjects.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Incomplete Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {incompleteCount > 0 ? (
                  <span className="text-red-600">{incompleteCount}</span>
                ) : (
                  <span className="text-green-600">0</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mark Sheet Table */}
      {markSheetData && markSheetData.students.length > 0 && (
        <Card>
          <CardHeader className="print:pb-2">
            <CardTitle className="print:text-center">Consolidated Mark Sheet</CardTitle>
            <CardDescription className="print:text-center">
              Detailed marks for all students across subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-accent border-b-2 border-gray-300">
                    <th className="py-2 px-2 text-left font-medium border border-gray-300" rowSpan={2}>
                      Roll No
                    </th>
                    <th className="py-2 px-2 text-left font-medium border border-gray-300" rowSpan={2}>
                      Student Name
                    </th>
                    {markSheetData.subjects.map((subject) => (
                      <th
                        key={subject.id}
                        className="py-2 px-2 text-center font-medium border border-gray-300"
                        colSpan={5}
                      >
                        {subject.name}
                      </th>
                    ))}
                    <th className="py-2 px-2 text-center font-medium border border-gray-300" rowSpan={2}>
                      Total
                    </th>
                    <th className="py-2 px-2 text-center font-medium border border-gray-300" rowSpan={2}>
                      %
                    </th>
                    <th className="py-2 px-2 text-center font-medium border border-gray-300" rowSpan={2}>
                      Grade
                    </th>
                  </tr>
                  <tr className="bg-accent border-b-2 border-gray-300">
                    {markSheetData.subjects.map((subject) => (
                      <>
                        <th key={`${subject.id}-th`} className="py-1 px-1 text-center text-[10px] border border-gray-300">
                          Th
                        </th>
                        <th key={`${subject.id}-pr`} className="py-1 px-1 text-center text-[10px] border border-gray-300">
                          Pr
                        </th>
                        <th key={`${subject.id}-in`} className="py-1 px-1 text-center text-[10px] border border-gray-300">
                          Int
                        </th>
                        <th key={`${subject.id}-tot`} className="py-1 px-1 text-center text-[10px] border border-gray-300">
                          Tot
                        </th>
                        <th key={`${subject.id}-gr`} className="py-1 px-1 text-center text-[10px] border border-gray-300">
                          Gr
                        </th>
                      </>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {markSheetData.students.map((student) => {
                    const hasIncomplete = student.subjects.some(s => s.isIncomplete);

                    return (
                      <tr
                        key={student.studentId}
                        className={`border-b ${hasIncomplete ? 'bg-red-50' : ''}`}
                      >
                        <td className="py-2 px-2 border border-gray-300">
                          {student.rollNumber || "-"}
                        </td>
                        <td className="py-2 px-2 border border-gray-300">
                          <div className="font-medium">{student.studentName}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {student.admissionId}
                          </div>
                        </td>
                        {markSheetData.subjects.map((subject) => {
                          const subjectData = student.subjects.find(s => s.subjectId === subject.id);

                          if (!subjectData) {
                            return (
                              <>
                                <td key={`${subject.id}-th`} className="py-2 px-1 text-center border border-gray-300">-</td>
                                <td key={`${subject.id}-pr`} className="py-2 px-1 text-center border border-gray-300">-</td>
                                <td key={`${subject.id}-in`} className="py-2 px-1 text-center border border-gray-300">-</td>
                                <td key={`${subject.id}-tot`} className="py-2 px-1 text-center border border-gray-300">-</td>
                                <td key={`${subject.id}-gr`} className="py-2 px-1 text-center border border-gray-300">-</td>
                              </>
                            );
                          }

                          if (subjectData.isAbsent) {
                            return (
                              <>
                                <td key={`${subject.id}-th`} className="py-2 px-1 text-center border border-gray-300 text-red-600">AB</td>
                                <td key={`${subject.id}-pr`} className="py-2 px-1 text-center border border-gray-300 text-red-600">AB</td>
                                <td key={`${subject.id}-in`} className="py-2 px-1 text-center border border-gray-300 text-red-600">AB</td>
                                <td key={`${subject.id}-tot`} className="py-2 px-1 text-center border border-gray-300 text-red-600">AB</td>
                                <td key={`${subject.id}-gr`} className="py-2 px-1 text-center border border-gray-300 text-red-600">AB</td>
                              </>
                            );
                          }

                          const cellClass = subjectData.isIncomplete
                            ? "py-2 px-1 text-center border border-gray-300 bg-yellow-100"
                            : "py-2 px-1 text-center border border-gray-300";

                          return (
                            <>
                              <td key={`${subject.id}-th`} className={cellClass}>
                                {subjectData.theoryMarks !== null ? subjectData.theoryMarks.toFixed(1) : "-"}
                              </td>
                              <td key={`${subject.id}-pr`} className={cellClass}>
                                {subjectData.practicalMarks !== null ? subjectData.practicalMarks.toFixed(1) : "-"}
                              </td>
                              <td key={`${subject.id}-in`} className={cellClass}>
                                {subjectData.internalMarks !== null ? subjectData.internalMarks.toFixed(1) : "-"}
                              </td>
                              <td key={`${subject.id}-tot`} className={cellClass}>
                                {subjectData.totalMarks !== null ? subjectData.totalMarks.toFixed(1) : "-"}
                              </td>
                              <td key={`${subject.id}-gr`} className={cellClass}>
                                {subjectData.grade || "-"}
                              </td>
                            </>
                          );
                        })}
                        <td className="py-2 px-2 text-center font-medium border border-gray-300">
                          {student.overallTotal.toFixed(1)}
                        </td>
                        <td className="py-2 px-2 text-center border border-gray-300">
                          {student.overallPercentage.toFixed(1)}%
                        </td>
                        <td className="py-2 px-2 text-center border border-gray-300">
                          <Badge className={
                            student.overallGrade?.startsWith('A') ? "bg-green-100 text-green-800" :
                              student.overallGrade?.startsWith('B') ? "bg-blue-100 text-blue-800" :
                                student.overallGrade?.startsWith('C') ? "bg-yellow-100 text-yellow-800" :
                                  "bg-red-100 text-red-800"
                          }>
                            {student.overallGrade}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {incompleteCount > 0 && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">{incompleteCount} student(s)</span> have incomplete marks entries (highlighted in red).
                  Yellow cells indicate missing component marks.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && !markSheetData && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileSpreadsheet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1">No Data</h3>
            <p className="text-sm text-muted-foreground">
              Select filters and click Generate to view the consolidated mark sheet
            </p>
          </CardContent>
        </Card>
      )}

      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:text-center {
            text-align: center;
          }
          
          .print\\:pb-2 {
            padding-bottom: 0.5rem;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
