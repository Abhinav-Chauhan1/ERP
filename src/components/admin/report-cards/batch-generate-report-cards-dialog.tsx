/**
 * Batch Generate Report Cards Dialog Component
 * 
 * Allows administrators to generate report cards for entire class
 * - Class and section selection
 * - Template selection
 * - Progress indicator
 * - Download batch PDF
 * 
 * Requirements: 5.3, 20.1, 20.2, 20.3, 20.4, 20.5
 */

'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, FileText, Download, Users, Archive, FileCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  generateBatchReportCards,
  getReportCardTemplates,
} from '@/lib/actions/report-card-generation';

interface BatchGenerateReportCardsDialogProps {
  classes: Array<{ id: string; name: string }>;
  sections: Array<{ id: string; name: string; classId: string }>;
  termId: string;
  termName: string;
  trigger?: React.ReactNode;
}

export function BatchGenerateReportCardsDialog({
  classes,
  sections,
  termId,
  termName,
  trigger,
}: BatchGenerateReportCardsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<'singlePdf' | 'individualZip'>('singlePdf');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [totalGenerated, setTotalGenerated] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const { toast } = useToast();

  // Filter sections based on selected class
  const filteredSections = selectedClass
    ? sections.filter((s) => s.classId === selectedClass)
    : [];

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

  // Reset section when class changes
  useEffect(() => {
    setSelectedSection('');
  }, [selectedClass]);

  const handleGenerate = async () => {
    if (!selectedClass || !selectedSection || !selectedTemplate) {
      toast({
        title: 'Missing Information',
        description: 'Please select class, section, and template.',
        variant: 'destructive',
      });
      return;
    }

    // For ZIP download, we skip the progress bar and server action call as it's handled by the download handler directly
    if (outputFormat === 'individualZip') {
      handleDownload();
      return;
    }

    setLoading(true);
    setProgress(0);

    // Simulate progress (since actual generation happens on server)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 5;
      });
    }, 800);

    try {
      // Generate single batch PDF
      const result = await generateBatchReportCards(
        selectedClass,
        selectedSection,
        termId,
        selectedTemplate
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.data) {
        setGeneratedUrl(result.data.pdfUrl);
        setTotalGenerated(result.data.totalGenerated);
        toast({
          title: 'Success',
          description: `Generated ${result.data.totalGenerated} report cards successfully!`,
        });
      } else {
        toast({
          title: 'Generation Failed',
          description: result.error || 'Failed to generate batch report cards.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
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
    if (outputFormat === 'individualZip') {
      const params = new URLSearchParams({
        classId: selectedClass,
        sectionId: selectedSection,
        termId: termId,
        templateId: selectedTemplate,
      });

      const url = `/api/reports/batch-download?${params.toString()}`;

      toast({
        title: "Download Started",
        description: "Your batch report card ZIP is being generated. The download will start automatically once ready.",
        duration: 5000,
      });

      // Direct navigation forces browser to respect Content-Disposition header
      window.location.href = url;
    } else if (generatedUrl) {
      window.open(generatedUrl, '_blank');
    }
  };

  const handleReset = () => {
    setGeneratedUrl(null);
    setTotalGenerated(0);
    setProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default">
            <Users className="mr-2 h-4 w-4" />
            Batch Generate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Batch Generate Report Cards</DialogTitle>
          <DialogDescription>
            Generate report cards for all students in a class - {termName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Class Selection */}
          <div className="space-y-2">
            <Label htmlFor="class">Select Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger id="class">
                <SelectValue placeholder="Choose a class" />
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

          {/* Section Selection */}
          <div className="space-y-2">
            <Label htmlFor="section">Select Section</Label>
            <Select
              value={selectedSection}
              onValueChange={setSelectedSection}
              disabled={!selectedClass}
            >
              <SelectTrigger id="section">
                <SelectValue placeholder="Choose a section" />
              </SelectTrigger>
              <SelectContent>
                {filteredSections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedClass && (
              <p className="text-sm text-muted-foreground">
                Select a class first
              </p>
            )}
          </div>

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
          </div>

          {/* Output Format Selection */}
          <div className="space-y-3">
            <Label>Output Format</Label>
            <RadioGroup
              value={outputFormat}
              onValueChange={(value) => setOutputFormat(value as 'singlePdf' | 'individualZip')}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="singlePdf" id="singlePdf" />
                <Label htmlFor="singlePdf" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Single PDF</p>
                      <p className="text-xs text-muted-foreground">All cards in one file</p>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="individualZip" id="individualZip" />
                <Label htmlFor="individualZip" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">ZIP Download</p>
                      <p className="text-xs text-muted-foreground">Individual PDFs in ZIP</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Progress Indicator */}
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Generating...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Generated Result */}
          {generatedUrl && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">
                  Successfully generated {totalGenerated} report cards!
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-700 border-green-300"
                  onClick={handleDownload}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                >
                  Generate Another
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleGenerate}
            disabled={
              !selectedClass ||
              !selectedSection ||
              !selectedTemplate ||
              loading
            }
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                {outputFormat === 'individualZip' ? 'Download ZIP' : 'Generate PDF'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
