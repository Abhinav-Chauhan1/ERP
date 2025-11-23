"use client";

/**
 * Bulk Certificate Generator Component
 * 
 * Allows administrators to generate certificates for multiple students at once.
 * Supports template selection, student selection, and progress tracking.
 * 
 * Requirements: 12.2 - Bulk Certificate Generation
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { bulkGenerateCertificates } from "@/lib/actions/certificateGenerationActions";
import { FileText, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";
import { toast } from "react-hot-toast";

interface Template {
  id: string;
  name: string;
  type: string;
  category?: string;
}

interface Student {
  id: string;
  name: string;
  admissionId: string;
  className: string;
  sectionName: string;
}

interface BulkCertificateGeneratorProps {
  templates: Template[];
  students: Student[];
}

export function BulkCertificateGenerator({
  templates,
  students,
}: BulkCertificateGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(students.map((s) => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a certificate template");
      return;
    }

    if (selectedStudents.size === 0) {
      toast.error("Please select at least one student");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setResults(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const result = await bulkGenerateCertificates(
        selectedTemplate,
        Array.from(selectedStudents)
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        setResults(result.data);
        toast.success(
          `Successfully generated ${result.data?.totalGenerated} out of ${result.data?.totalRequested} certificates`
        );
      } else {
        toast.error(result.error || "Failed to generate certificates");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const allSelected = selectedStudents.size === students.length && students.length > 0;
  const someSelected = selectedStudents.size > 0 && selectedStudents.size < students.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Certificate Generation</CardTitle>
          <CardDescription>
            Generate certificates for multiple students at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Certificate Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
              disabled={isGenerating}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{template.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {template.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Students</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  disabled={isGenerating}
                  className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                />
                <Label htmlFor="select-all" className="cursor-pointer">
                  Select All ({selectedStudents.size} of {students.length})
                </Label>
              </div>
            </div>

            <div className="border rounded-lg max-h-96 overflow-y-auto">
              <div className="divide-y">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={(checked) =>
                        handleSelectStudent(student.id, checked as boolean)
                      }
                      disabled={isGenerating}
                    />
                    <Label
                      htmlFor={`student-${student.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.admissionId} • {student.className} - {student.sectionName}
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Generating certificates...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Results */}
          {results && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Generation Complete</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Requested:</span>
                      <span className="ml-2 font-medium">{results.totalRequested}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Successfully Generated:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {results.totalGenerated}
                      </span>
                    </div>
                  </div>
                  {results.errors && results.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-destructive">Errors:</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {results.errors.slice(0, 5).map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                        {results.errors.length > 5 && (
                          <li>... and {results.errors.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedTemplate || selectedStudents.size === 0}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Certificates
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificate List */}
      {results && results.certificates && results.certificates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Certificates</CardTitle>
            <CardDescription>
              View and download generated certificates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.certificates.map((cert: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {cert.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      {cert.success ? (
                        <>
                          <p className="font-medium">Certificate #{cert.certificateNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            Generated successfully
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">Generation Failed</p>
                          <p className="text-sm text-destructive">{cert.error}</p>
                        </>
                      )}
                    </div>
                  </div>
                  {cert.success && cert.pdfUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={cert.pdfUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
