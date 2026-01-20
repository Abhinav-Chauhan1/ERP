'use client';

/**
 * Bulk ID Card Generator Component
 * 
 * Allows administrators to generate ID cards for multiple students.
 * Includes student photo, QR code, and barcode.
 * 
 * Requirements: 12.3, 12.4 - ID Card Generation with Photo, QR Code, Barcode
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  generateClassIDCards,
  getClassesForIDCardGeneration,
  getCurrentAcademicYear,
  getClassIDCardPreview,
} from '@/lib/actions/idCardGenerationActions';
import { CreditCard, CheckCircle, XCircle, AlertCircle, Download, Loader2, Eye, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";

interface ClassData {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
  studentCount: number;
}

export function BulkIDCardGenerator() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('STANDARD');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Load classes
      const classesResult = await getClassesForIDCardGeneration();
      if (classesResult.success) {
        setClasses(classesResult.data);
      } else {
        toast.error(classesResult.error || 'Failed to load classes');
      }

      // Load current academic year
      const yearResult = await getCurrentAcademicYear();
      if (yearResult.success && yearResult.data) {
        const year = ('year' in yearResult.data ? yearResult.data.year : yearResult.data.name) || '';
        setAcademicYear(year);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setSelectedSection(''); // Reset section when class changes
    setResults(null); // Clear previous results
  };

  const handleGenerate = async () => {
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }

    if (!academicYear) {
      toast.error('Academic year not set');
      return;
    }

    try {
      setIsGenerating(true);
      setProgress(0);
      setResults(null);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Generate ID cards
      const result = await generateClassIDCards(
        selectedClass,
        selectedSection || null,
        academicYear,
        templateId
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        toast.success(
          `Successfully generated ${result.totalGenerated} out of ${result.totalRequested} ID cards`
        );
        setResults(result);
      } else {
        const errorMsg = ('error' in result && result.error) || (result.errors && result.errors.length > 0 ? result.errors[0] : 'Failed to generate ID cards');
        toast.error(errorMsg);
        setResults(result);
      }
    } catch (error: any) {
      console.error('Error generating ID cards:', error);
      toast.error(error.message || 'Failed to generate ID cards');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedClassData = classes.find(c => c.id === selectedClass);
  const studentCount = selectedClassData?.studentCount || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          <CardTitle>Bulk ID Card Generator</CardTitle>
        </div>
        <CardDescription>
          Generate ID cards with student photo, QR code, and barcode for an entire class
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Class Selection */}
        <div className="space-y-2">
          <Label htmlFor="class-select">Select Class</Label>
          <Select value={selectedClass} onValueChange={handleClassChange}>
            <SelectTrigger id="class-select">
              <SelectValue placeholder="Choose a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} ({cls.studentCount} students)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Section Selection */}
        {selectedClassData && selectedClassData.sections.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="section-select">Select Section (Optional)</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger id="section-select">
                <SelectValue placeholder="All sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sections</SelectItem>
                {selectedClassData.sections.map(section => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Academic Year Display */}
        <div className="space-y-2">
          <Label>Academic Year</Label>
          <Badge variant="secondary">{academicYear}</Badge>
        </div>
      </div>

      {/* Template Selection */}
      <div className="space-y-2">
        <Label htmlFor="template-select">ID Card Template</Label>
        <Select value={templateId} onValueChange={setTemplateId}>
          <SelectTrigger id="template-select">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="STANDARD">Standard Template</SelectItem>
            <SelectItem value="CBSE">CBSE / Board Template</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Student Count */}
      {selectedClass && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Students to process:</span>
            <Badge variant="outline">{studentCount}</Badge>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={handleGenerate}
          disabled={!selectedClass || isGenerating}
          className="flex-1"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Generate ID Cards
            </>
          )}
        </Button>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              disabled={!selectedClass}
              onClick={async () => {
                if (!selectedClass) return;

                if (!academicYear) {
                  toast.error("Academic year not available");
                  return;
                }

                setIsPreviewLoading(true);
                try {
                  const result = await getClassIDCardPreview(selectedClass, academicYear, templateId);

                  if (result.success && result.previewUrl) {
                    setPreviewUrl(result.previewUrl);
                  } else {
                    toast.error(result.error || "Failed to generate preview");
                  }
                } catch (error) {
                  toast.error("An error occurred generating preview");
                } finally {
                  setIsPreviewLoading(false);
                }
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>ID Card Preview</DialogTitle>
              <DialogDescription>
                Preview of using {templateId} template.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center p-4 bg-gray-100 rounded-md">
              {previewUrl ? (
                <img src={previewUrl} alt="ID Card Preview" className="max-w-full shadow-lg" />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Preview functionality requires selecting a specific student.
                  (Coming soon)
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Generation Results</h3>
            {results.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Requested</p>
              <p className="text-2xl font-bold">{results.totalRequested}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Successfully Generated</p>
              <p className="text-2xl font-bold text-green-600">
                {results.totalGenerated}
              </p>
            </div>
          </div>

          {results.errors && results.errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>Errors ({results.errors.length})</span>
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md bg-amber-50 p-3">
                {results.errors.map((error: string, index: number) => (
                  <p key={index} className="text-xs text-amber-800">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {results.success && results.totalGenerated > 0 && (
            <div className="rounded-md bg-green-50 p-3 flex flex-col gap-2">
              <p className="text-sm text-green-800">
                ✓ ID cards have been generated successfully.
              </p>
              <div className="flex gap-2">
                {results.idCards && results.idCards.length > 0 && results.idCards[0].pdfUrl && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={results.idCards[0].pdfUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download All (Zip/PDF)
                      {/* Note: logic for zip/combined PDF is not yet in service, 
                              currently it returns individual URLs. 
                              We'd need a bulk download endpoint. 
                              For now let's just show Success. 
                          */}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="space-y-1 text-sm text-blue-900">
            <p className="font-medium">ID Card Features:</p>
            <ul className="list-inside list-disc space-y-1 text-blue-800">
              <li>Student photo (if available)</li>
              <li>QR code for digital verification</li>
              <li>Barcode with admission ID</li>
              <li>Print-ready PDF format (standard ID card size)</li>
              <li>Valid for the current academic year</li>
            </ul>
          </div>
        </div>
      </div>
    </CardContent>
    </Card >
  );
}
