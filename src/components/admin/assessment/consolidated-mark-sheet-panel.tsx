"use client";

import { useState, useEffect } from "react";
import {
  Download, FileSpreadsheet,
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

export function ConsolidatedMarkSheetPanel() {
  const [loading, setLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [termFilter, setTermFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [examFilter, setExamFilter] = useState("");

  const [filterOptions, setFilterOptions] = useState<any>({
    terms: [],
    classes: [],
    sections: [],
    exams: []
  });

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
    } catch {
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
        if (result.data.students.length === 0) toast.error("No students found for the selected filters");
      } else {
        setError(result.error || "Failed to fetch mark sheet");
        toast.error(result.error || "Failed to fetch mark sheet");
      }
    } catch {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCSV() {
    if (!classFilter || !sectionFilter) { toast.error("Please select both class and section"); return; }
    try {
      const result = await exportConsolidatedMarkSheetCSV({ classId: classFilter, sectionId: sectionFilter, termId: termFilter || undefined, examId: examFilter || undefined });
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `consolidated-mark-sheet-${Date.now()}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Mark sheet exported successfully");
      } else {
        toast.error(result.error || "Failed to export mark sheet");
      }
    } catch { toast.error("An unexpected error occurred"); }
  }

  async function handleExportExcel() {
    if (!classFilter || !sectionFilter) { toast.error("Please select both class and section"); return; }
    try {
      const result = await getConsolidatedMarkSheetForExcel({ classId: classFilter, sectionId: sectionFilter, termId: termFilter || undefined, examId: examFilter || undefined });
      if (result.success && result.data) {
        const { dataRows, subjects } = result.data;
        const exportData = dataRows.map((row: any[]) => {
          const obj: any = { 'Roll No': row[0], 'Admission ID': row[1], 'Student Name': row[2] };
          let colIndex = 3;
          subjects.forEach((subject: { id: string; name: string }) => {
            obj[`${subject.name} - Theory`] = row[colIndex++] || '';
            obj[`${subject.name} - Practical`] = row[colIndex++] || '';
            obj[`${subject.name} - Internal`] = row[colIndex++] || '';
            obj[`${subject.name} - Total`] = row[colIndex++] || '';
            obj[`${subject.name} - Grade`] = row[colIndex++] || '';
          });
          obj['Overall Total'] = row[colIndex++] || '';
          obj['Overall %'] = row[colIndex++] || '';
          obj['Overall Grade'] = row[colIndex] || '';
          return obj;
        });
        await exportToExcel(exportData, { filename: `consolidated-mark-sheet-${Date.now()}`, title: 'Consolidated Mark Sheet', subtitle: `Class: ${classFilter} | Section: ${sectionFilter}`, includeTimestamp: true });
        toast.success("Mark sheet exported successfully");
      } else {
        toast.error(result.error || "Failed to export mark sheet");
      }
    } catch { toast.error("An unexpected error occurred"); }
  }

  async function handleExportPDF() {
    if (!markSheetData) { toast.error("No data to export"); return; }
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      doc.setFontSize(16);
      doc.text('Consolidated Mark Sheet', 14, 15);
      const headers = [
        [{ content: 'Roll No', rowSpan: 2 }, { content: 'Student Name', rowSpan: 2 }, ...markSheetData.subjects.flatMap(s => [{ content: s.name, colSpan: 5 }]), { content: 'Total', rowSpan: 2 }, { content: '%', rowSpan: 2 }, { content: 'Grade', rowSpan: 2 }],
        [...markSheetData.subjects.flatMap(() => ['Th', 'Pr', 'Int', 'Tot', 'Gr'])]
      ];
      const body = markSheetData.students.map(student => {
        const subjectData = markSheetData.subjects.flatMap(subject => {
          const sr = student.subjects.find(s => s.subjectId === subject.id);
          if (!sr) return ['-', '-', '-', '-', '-'];
          if (sr.isAbsent) return ['AB', 'AB', 'AB', 'AB', 'AB'];
          return [sr.theoryMarks?.toFixed(1) ?? '-', sr.practicalMarks?.toFixed(1) ?? '-', sr.internalMarks?.toFixed(1) ?? '-', sr.totalMarks?.toFixed(1) ?? '-', sr.grade ?? '-'];
        });
        return [student.rollNumber || '-', student.studentName, ...subjectData, student.overallTotal.toFixed(1), student.overallPercentage.toFixed(1), student.overallGrade || '-'];
      });
      autoTable(doc, { head: headers, body, startY: 20, styles: { fontSize: 7, cellPadding: 1 }, headStyles: { fillColor: [66, 139, 202], halign: 'center' }, columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 40 } }, didDrawPage: (data) => { doc.setFontSize(8); doc.text(`Page ${data.pageNumber}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' }); } });
      doc.save(`consolidated-mark-sheet-${Date.now()}.pdf`);
      toast.success("PDF exported successfully");
    } catch { toast.error("An unexpected error occurred"); }
  }

  const filteredSections = classFilter ? filterOptions.sections.filter((s: any) => s.classId === classFilter) : filterOptions.sections;
  const filteredExams = termFilter ? filterOptions.exams.filter((e: any) => e.termId === termFilter) : filterOptions.exams;
  const incompleteCount = markSheetData?.students.reduce((count, student) => count + (student.subjects.some(s => s.isIncomplete) ? 1 : 0), 0) || 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Export buttons */}
      <div className="flex flex-wrap gap-2 justify-end print:hidden">
        <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!markSheetData || loading}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!markSheetData || loading}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!markSheetData || loading}>
          <FileText className="mr-2 h-4 w-4" /> Export PDF
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!markSheetData || loading}>
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
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
          <CardDescription>Choose class, section, and optionally term or specific exam</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Term (Optional)</label>
              <Select value={termFilter || "all"} onValueChange={(v) => setTermFilter(v === "all" ? "" : v)} disabled={filtersLoading}>
                <SelectTrigger><SelectValue placeholder="All Terms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {filterOptions.terms.map((term: any) => <SelectItem key={term.id} value={term.id}>{term.name} ({term.academicYear.name})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Class <span className="text-red-500">*</span></label>
              <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setSectionFilter(""); }} disabled={filtersLoading}>
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>
                  {filterOptions.classes.map((cls: any) => <SelectItem key={cls.id} value={cls.id}>{cls.name} ({cls.academicYear.name})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Section <span className="text-red-500">*</span></label>
              <Select value={sectionFilter} onValueChange={setSectionFilter} disabled={filtersLoading || !classFilter}>
                <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                <SelectContent>
                  {filteredSections.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Exam (Optional)</label>
              <Select value={examFilter || "all"} onValueChange={(v) => setExamFilter(v === "all" ? "" : v)} disabled={filtersLoading}>
                <SelectTrigger><SelectValue placeholder="All Exams" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {filteredExams.map((exam: any) => <SelectItem key={exam.id} value={exam.id}>{exam.title} - {exam.subject.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleFetchMarkSheet} disabled={loading || !classFilter || !sectionFilter} className="w-full">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</> : <><Filter className="mr-2 h-4 w-4" />Generate</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {markSheetData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{markSheetData.totalStudents}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Total Subjects</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{markSheetData.subjects.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Incomplete Entries</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{incompleteCount > 0 ? <span className="text-red-600">{incompleteCount}</span> : <span className="text-green-600">0</span>}</div></CardContent></Card>
        </div>
      )}

      {/* Mark Sheet Table */}
      {markSheetData && markSheetData.students.length > 0 && (
        <Card>
          <CardHeader className="print:pb-2">
            <CardTitle className="print:text-center">Consolidated Mark Sheet</CardTitle>
            <CardDescription className="print:text-center">Detailed marks for all students across subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-accent border-b-2 border-gray-300">
                    <th className="py-2 px-2 text-left font-medium border border-gray-300" rowSpan={2}>Roll No</th>
                    <th className="py-2 px-2 text-left font-medium border border-gray-300" rowSpan={2}>Student Name</th>
                    {markSheetData.subjects.map((subject) => (
                      <th key={subject.id} className="py-2 px-2 text-center font-medium border border-gray-300" colSpan={5}>{subject.name}</th>
                    ))}
                    <th className="py-2 px-2 text-center font-medium border border-gray-300" rowSpan={2}>Total</th>
                    <th className="py-2 px-2 text-center font-medium border border-gray-300" rowSpan={2}>%</th>
                    <th className="py-2 px-2 text-center font-medium border border-gray-300" rowSpan={2}>Grade</th>
                  </tr>
                  <tr className="bg-accent border-b-2 border-gray-300">
                    {markSheetData.subjects.map((subject) => (
                      <>
                        <th key={`${subject.id}-th`} className="py-1 px-1 text-center text-[10px] border border-gray-300">Th</th>
                        <th key={`${subject.id}-pr`} className="py-1 px-1 text-center text-[10px] border border-gray-300">Pr</th>
                        <th key={`${subject.id}-in`} className="py-1 px-1 text-center text-[10px] border border-gray-300">Int</th>
                        <th key={`${subject.id}-tot`} className="py-1 px-1 text-center text-[10px] border border-gray-300">Tot</th>
                        <th key={`${subject.id}-gr`} className="py-1 px-1 text-center text-[10px] border border-gray-300">Gr</th>
                      </>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {markSheetData.students.map((student) => {
                    const hasIncomplete = student.subjects.some(s => s.isIncomplete);
                    return (
                      <tr key={student.studentId} className={`border-b ${hasIncomplete ? 'bg-red-50' : ''}`}>
                        <td className="py-2 px-2 border border-gray-300">{student.rollNumber || "-"}</td>
                        <td className="py-2 px-2 border border-gray-300">
                          <div className="font-medium">{student.studentName}</div>
                          <div className="text-[10px] text-muted-foreground">{student.admissionId}</div>
                        </td>
                        {markSheetData.subjects.map((subject) => {
                          const sd = student.subjects.find(s => s.subjectId === subject.id);
                          if (!sd) return (
                            <>
                              <td key={`${subject.id}-th`} className="py-2 px-1 text-center border border-gray-300">-</td>
                              <td key={`${subject.id}-pr`} className="py-2 px-1 text-center border border-gray-300">-</td>
                              <td key={`${subject.id}-in`} className="py-2 px-1 text-center border border-gray-300">-</td>
                              <td key={`${subject.id}-tot`} className="py-2 px-1 text-center border border-gray-300">-</td>
                              <td key={`${subject.id}-gr`} className="py-2 px-1 text-center border border-gray-300">-</td>
                            </>
                          );
                          if (sd.isAbsent) return (
                            <>
                              <td key={`${subject.id}-th`} className="py-2 px-1 text-center border border-gray-300 text-red-600">AB</td>
                              <td key={`${subject.id}-pr`} className="py-2 px-1 text-center border border-gray-300 text-red-600">AB</td>
                              <td key={`${subject.id}-in`} className="py-2 px-1 text-center border border-gray-300 text-red-600">AB</td>
                              <td key={`${subject.id}-tot`} className="py-2 px-1 text-center border border-gray-300 text-red-600">AB</td>
                              <td key={`${subject.id}-gr`} className="py-2 px-1 text-center border border-gray-300 text-red-600">AB</td>
                            </>
                          );
                          const c = sd.isIncomplete ? "py-2 px-1 text-center border border-gray-300 bg-yellow-100" : "py-2 px-1 text-center border border-gray-300";
                          return (
                            <>
                              <td key={`${subject.id}-th`} className={c}>{sd.theoryMarks !== null ? sd.theoryMarks.toFixed(1) : "-"}</td>
                              <td key={`${subject.id}-pr`} className={c}>{sd.practicalMarks !== null ? sd.practicalMarks.toFixed(1) : "-"}</td>
                              <td key={`${subject.id}-in`} className={c}>{sd.internalMarks !== null ? sd.internalMarks.toFixed(1) : "-"}</td>
                              <td key={`${subject.id}-tot`} className={c}>{sd.totalMarks !== null ? sd.totalMarks.toFixed(1) : "-"}</td>
                              <td key={`${subject.id}-gr`} className={c}>{sd.grade || "-"}</td>
                            </>
                          );
                        })}
                        <td className="py-2 px-2 text-center font-medium border border-gray-300">{student.overallTotal.toFixed(1)}</td>
                        <td className="py-2 px-2 text-center border border-gray-300">{student.overallPercentage.toFixed(1)}%</td>
                        <td className="py-2 px-2 text-center border border-gray-300">
                          <Badge className={student.overallGrade?.startsWith('A') ? "bg-green-100 text-green-800" : student.overallGrade?.startsWith('B') ? "bg-blue-100 text-blue-800" : student.overallGrade?.startsWith('C') ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
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
                <AlertDescription><span className="font-medium">{incompleteCount} student(s)</span> have incomplete marks entries. Yellow cells indicate missing component marks.</AlertDescription>
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
            <p className="text-sm text-muted-foreground">Select filters and click Generate to view the consolidated mark sheet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
