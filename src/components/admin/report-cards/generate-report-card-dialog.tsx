/**
 * Generate Report Card Dialog Component
 * 
 * Allows administrators to generate report cards for students
 * - Single student report card generation
 * - Template selection
 * - Preview functionality
 * - Download generated PDF
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

'use client';

import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Download, Eye } from 'lucide-react';
import {
  generateSingleReportCard,
  getReportCardTemplates,
  previewReportCard,
} from '@/lib/actions/report-card-generation';
import { getPerformanceColor } from '@/lib/utils/grade-calculator';

interface GenerateReportCardDialogProps {
  studentId: string;
  studentName: string;
  termId: string;
  termName: string;
  trigger?: React.ReactNode;
}

export function GenerateReportCardDialog({
  studentId,
  studentName,
  termId,
  termName,
  trigger,
}: GenerateReportCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const { toast } = useToast();

  // Load templates when dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);

    if (isOpen && templates.length === 0) {
      const result = await getReportCardTemplates();
      if (result.success && result.data) {
        setTemplates(result.data);
        // Auto-select default template
        const defaultTemplate = result.data.find((t: any) => t.isDefault);
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate.id);
        }
      }
    }
  };

  const handlePreview = async () => {
    if (!selectedTemplate) {
      toast({
        title: 'Template Required',
        description: 'Please select a template first.',
        variant: 'destructive',
      });
      return;
    }

    setPreviewing(true);
    try {
      const result = await previewReportCard(studentId, termId);

      if (result.success) {
        setPreviewData(result.data);
        toast({
          title: 'Preview Loaded',
          description: 'Report card data loaded successfully.',
        });
      } else {
        toast({
          title: 'Preview Failed',
          description: result.error || 'Failed to load preview data.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast({
        title: 'Template Required',
        description: 'Please select a template to generate the report card.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await generateSingleReportCard(
        studentId,
        termId,
        selectedTemplate
      );

      if (result.success && result.data) {
        setGeneratedPdfUrl(result.data.pdfUrl);
        toast({
          title: 'Success',
          description: 'Report card generated successfully!',
        });
      } else {
        toast({
          title: 'Generation Failed',
          description: result.error || 'Failed to generate report card.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedPdfUrl) {
      window.open(generatedPdfUrl, '_blank');
    }
  };

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
          <DialogDescription>
            Generate report card for {studentName} - {termName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Select Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                    {template.isDefault && ' (Default)'}
                    {' - '}
                    {template.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Loading templates...
              </p>
            )}
          </div>

          {/* Preview Data Display */}
          {previewData && (
            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-semibold text-sm">Preview Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Subjects:</span>{' '}
                  {previewData.subjects?.length || 0}
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Overall Grade:</span>{' '}
                  <span
                    className="font-bold"
                    style={{ color: previewData.overallPerformance?.percentage ? getPerformanceColor(previewData.overallPerformance.percentage) : undefined }}
                  >
                    {previewData.overallPerformance?.grade || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Percentage:</span>{' '}
                  <span
                    className="font-bold"
                    style={{ color: previewData.overallPerformance?.percentage ? getPerformanceColor(previewData.overallPerformance.percentage) : undefined }}
                  >
                    {previewData.overallPerformance?.percentage?.toFixed(2) || 0}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Attendance:</span>{' '}
                  {previewData.attendance?.percentage?.toFixed(2) || 0}%
                </div>
              </div>
            </div>
          )}

          {/* Generated PDF Link */}
          {generatedPdfUrl && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-900">
                Report card generated successfully!
              </p>
              <Button
                variant="link"
                className="h-auto p-0 text-green-700"
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
            disabled={!selectedTemplate || previewing || loading}
          >
            {previewing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Preview Data
              </>
            )}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!selectedTemplate || loading || previewing}
          >
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
