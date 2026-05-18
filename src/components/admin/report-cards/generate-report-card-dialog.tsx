/**
 * Generate Report Card Dialog Component
 * 
 * Allows administrators to generate report cards for students
 * - Single student report card generation (term-based OR CBSE annual)
 * - Template selection (term-based mode)
 * - Academic year selection (CBSE mode)
 * - Preview functionality
 * - Download generated PDF
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Download, Eye, GraduationCap, BookOpen, ClipboardList } from 'lucide-react';
import {
  generateSingleReportCard,
  generateSingleExamTypeReportCard,
  previewReportCard,
} from '@/lib/actions/report-card-generation';
import {
  generateCBSEReportCardAction,
  previewCBSEReportCardAction,
  getExamTypesForTerm,
} from '@/lib/actions/reportCardsActions';
import { getAcademicYearsForDropdown } from '@/lib/actions/termsActions';
import { getPerformanceColor } from '@/lib/utils/grade-calculator';

type ReportMode = 'term' | 'cbse' | 'examtype';

interface GenerateReportCardDialogProps {
  studentId: string;
  studentName: string;
  termId?: string;
  termName?: string;
  /** When provided (e.g. on yearwise pages), skip year selection */
  academicYearId?: string;
  academicYearName?: string;
  trigger?: React.ReactNode;
  /** Default mode — callers can force CBSE when appropriate */
  defaultMode?: ReportMode;
}

export function GenerateReportCardDialog({
  studentId,
  studentName,
  termId,
  termName,
  academicYearId: propYearId,
  academicYearName,
  trigger,
  defaultMode = 'term',
}: GenerateReportCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ReportMode>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // CBSE state
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(propYearId ?? '');

  // Exam-type state
  const [examTypes, setExamTypes] = useState<{ id: string; name: string }[]>([]);
  const [selectedExamTypeId, setSelectedExamTypeId] = useState('');

  // Result state (shared)
  const [generatedPdf, setGeneratedPdf] = useState<{
    base64: string;
    fileName: string;
  } | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const { toast } = useToast();

  // Load academic years / exam types when dialog opens
  const handleOpenChange = useCallback(
    async (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) return;

      // Reset
      setGeneratedPdf(null);
      setPreviewData(null);

      if (mode === 'cbse' && academicYears.length === 0) {
        const result = await getAcademicYearsForDropdown();
        if (result.success && result.data) {
          setAcademicYears(result.data);
          if (!selectedYear) {
            const current = result.data.find((y: any) => y.isCurrent);
            if (current) setSelectedYear(current.id);
          }
        }
      }

      if (mode === 'examtype' && termId && examTypes.length === 0) {
        const result = await getExamTypesForTerm(termId, studentId);
        if (result.success && result.data) {
          setExamTypes(result.data);
          if (result.data.length > 0) setSelectedExamTypeId(result.data[0].id);
        }
      }
    },
    [mode, academicYears.length, examTypes.length, selectedYear, termId, studentId],
  );

  // Also load data when mode changes while dialog is open
  useEffect(() => {
    if (!open) return;

    if (mode === 'cbse' && academicYears.length === 0) {
      getAcademicYearsForDropdown().then((result) => {
        if (result.success && result.data) {
          setAcademicYears(result.data);
          if (!selectedYear) {
            const current = result.data.find((y: any) => y.isCurrent);
            if (current) setSelectedYear(current.id);
          }
        }
      });
    }
    if (mode === 'examtype' && termId && examTypes.length === 0) {
      getExamTypesForTerm(termId, studentId).then((result) => {
        if (result.success && result.data) {
          setExamTypes(result.data);
          if (result.data.length > 0 && !selectedExamTypeId) {
            setSelectedExamTypeId(result.data[0].id);
          }
        }
      });
    }
  }, [mode, open, academicYears.length, examTypes.length, selectedYear, selectedExamTypeId, termId, studentId]);

  /* ── Preview ────────────────────────────────────────── */
  const handlePreview = async () => {
    setPreviewing(true);
    try {
      if (mode === 'term') {
        if (!termId) {
          toast({
            title: 'Missing Info',
            description: 'A term is required for term-based preview.',
            variant: 'destructive',
          });
          return;
        }
        const result = await previewReportCard(studentId, termId);
        if (result.success) {
          setPreviewData(result.data);
        } else {
          toast({ title: 'Preview Failed', description: result.error, variant: 'destructive' });
        }
      } else if (mode === 'examtype') {
        if (!termId || !selectedExamTypeId) {
          toast({ title: 'Missing Info', description: 'Select an exam type first.', variant: 'destructive' });
          return;
        }
        const result = await previewReportCard(studentId, termId);
        if (result.success) {
          setPreviewData(result.data);
        } else {
          toast({ title: 'Preview Failed', description: result.error, variant: 'destructive' });
        }
      } else {
        // CBSE preview
        if (!selectedYear) {
          toast({ title: 'Select Year', description: 'Choose an academic year first.', variant: 'destructive' });
          return;
        }
        const result = await previewCBSEReportCardAction({
          studentId,
          academicYearId: selectedYear,
        });
        if (result.success) {
          setPreviewData(result.reportData);
          if (result.pdfBase64) {
            setGeneratedPdf({
              base64: result.pdfBase64,
              fileName: `CBSE_Preview_${studentName.replace(/\s+/g, '_')}.pdf`,
            });
          }
        } else {
          toast({ title: 'Preview Failed', description: result.error, variant: 'destructive' });
        }
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setPreviewing(false);
    }
  };

  /* ── Generate ───────────────────────────────────────── */
  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (mode === 'term') {
        if (!termId) {
          toast({ title: 'Missing Info', description: 'A term is required.', variant: 'destructive' });
          return;
        }
        const result = await generateSingleReportCard(studentId, termId);
        if (result.success && result.data?.pdfBase64) {
          setGeneratedPdf({
            base64: result.data.pdfBase64,
            fileName: `Report_Card_${studentName.replace(/\s+/g, '_')}${termName ? `_${termName.replace(/\s+/g, '_')}` : ''}.pdf`,
          });
          toast({ title: 'Success', description: 'Report card generated!' });
        } else {
          toast({ title: 'Failed', description: result.error, variant: 'destructive' });
        }
      } else if (mode === 'examtype') {
        if (!termId || !selectedExamTypeId) {
          toast({ title: 'Missing Info', description: 'Select a term and exam type.', variant: 'destructive' });
          return;
        }
        const result = await generateSingleExamTypeReportCard(studentId, termId, selectedExamTypeId);
        if (result.success && result.data?.pdfBase64) {
          const examTypeName = examTypes.find(e => e.id === selectedExamTypeId)?.name || 'ExamType';
          setGeneratedPdf({
            base64: result.data.pdfBase64,
            fileName: `Report_Card_${studentName.replace(/\s+/g, '_')}_${examTypeName.replace(/\s+/g, '_')}.pdf`,
          });
          toast({ title: 'Success', description: 'Exam-type report card generated!' });
        } else {
          toast({ title: 'Failed', description: result.error, variant: 'destructive' });
        }
      } else {
        // CBSE generate
        if (!selectedYear) {
          toast({ title: 'Select Year', description: 'Choose an academic year first.', variant: 'destructive' });
          return;
        }
        const result = await generateCBSEReportCardAction({
          studentId,
          academicYearId: selectedYear,
        });
        if (result.success && result.pdfBase64) {
          setGeneratedPdf({
            base64: result.pdfBase64,
            fileName: result.fileName ?? 'CBSE_Report_Card.pdf',
          });
          toast({ title: 'Success', description: 'CBSE report card generated!' });
        } else {
          toast({ title: 'Failed', description: result.error, variant: 'destructive' });
        }
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Download helper ────────────────────────────────── */
  const handleDownload = () => {
    if (!generatedPdf) return;
    const byteChars = atob(generatedPdf.base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedPdf.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Can-act guard ──────────────────────────────────── */
  const canAct =
    mode === 'term'
      ? !!termId
      : mode === 'examtype'
      ? !!termId && !!selectedExamTypeId
      : !!selectedYear;

  const description =
    mode === 'term'
      ? `Generate term report card for ${studentName}${termName ? ` — ${termName}` : ''}`
      : mode === 'examtype'
      ? `Generate per-exam-type report card for ${studentName}${termName ? ` — ${termName}` : ''}`
      : `Generate annual CBSE report card for ${studentName}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report Card
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate Report Card</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mode Selector */}
          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v as ReportMode);
              setGeneratedPdf(null);
              setPreviewData(null);
            }}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="term" className="gap-1.5">
                <BookOpen className="h-4 w-4" />
                Term-Based
              </TabsTrigger>
              <TabsTrigger value="cbse" className="gap-1.5">
                <GraduationCap className="h-4 w-4" />
                CBSE Annual
              </TabsTrigger>
              <TabsTrigger value="examtype" className="gap-1.5">
                <ClipboardList className="h-4 w-4" />
                By Exam Type
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Exam-type-specific: Exam type selection */}
          {mode === 'examtype' && (
            <div className="space-y-3">
              {!termId && (
                <p className="text-sm text-amber-600">
                  No term context available. Open this dialog from a term page.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="exam-type">Exam Type</Label>
                <Select value={selectedExamTypeId} onValueChange={setSelectedExamTypeId} disabled={!termId}>
                  <SelectTrigger id="exam-type">
                    <SelectValue placeholder="Choose an exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypes.length > 0 ? (
                      examTypes.map((et) => (
                        <SelectItem key={et.id} value={et.id}>{et.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No exam types found for this term</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Term-specific: Term context notice */}
          {mode === 'term' && !termId && (
            <p className="text-sm text-amber-600">
              No term context available. Open this dialog from a term page.
            </p>
          )}

          {/* CBSE-specific: Academic year selection */}
          {mode === 'cbse' && (
            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="academic-year">
                  <SelectValue placeholder="Choose academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}
                      {y.isCurrent && ' (Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Preview Data Display */}
          {previewData && (
            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-semibold text-sm">Preview Summary</h4>
              {mode === 'term' ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Subjects:</span>{' '}
                    {previewData.subjects?.length || 0}
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Overall Grade:</span>{' '}
                    <span
                      className="font-bold"
                      style={{
                        color: previewData.overallPerformance?.percentage
                          ? getPerformanceColor(previewData.overallPerformance.percentage)
                          : undefined,
                      }}
                    >
                      {previewData.overallPerformance?.grade || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Percentage:</span>{' '}
                    <span
                      className="font-bold"
                      style={{
                        color: previewData.overallPerformance?.percentage
                          ? getPerformanceColor(previewData.overallPerformance.percentage)
                          : undefined,
                      }}
                    >
                      {previewData.overallPerformance?.percentage?.toFixed(2) || 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Attendance:</span>{' '}
                    {previewData.attendance?.percentage?.toFixed(2) || 0}%
                  </div>
                </div>
              ) : (
                // CBSE preview summary
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Student:</span>{' '}
                    {previewData.studentName}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Class:</span>{' '}
                    {previewData.className} - {previewData.section}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Result:</span>{' '}
                    <Badge
                      variant={
                        previewData.resultStatus === 'PASS'
                          ? 'default'
                          : previewData.resultStatus === 'FAIL'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {previewData.resultStatus || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Percentage:</span>{' '}
                    <span className="font-bold">
                      {previewData.percentage?.toFixed(2) || 0}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generated PDF Link */}
          {generatedPdf && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-4">
              <p className="text-sm font-medium text-green-900 dark:text-green-300">
                Report card generated successfully!
              </p>
              <Button
                variant="link"
                className="h-auto p-0 text-green-700 dark:text-green-400"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!canAct || previewing || loading}
          >
            {previewing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </>
            )}
          </Button>
          <Button onClick={handleGenerate} disabled={!canAct || loading || previewing}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
