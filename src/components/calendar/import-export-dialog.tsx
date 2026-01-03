"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

interface ImportExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

type ImportFormat = "ical" | "csv" | "json";
type ExportFormat = "ical" | "csv" | "json";

interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: Array<{ row: number; error: string }>;
}

/**
 * ImportExportDialog Component
 * 
 * Dialog for importing and exporting calendar events.
 * Supports multiple formats: iCal, CSV, and JSON.
 * 
 * Features:
 * - Import events from files
 * - Export events to files
 * - Format selection
 * - Progress tracking
 * - Error reporting
 * - Duplicate detection
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function ImportExportDialog({
  isOpen,
  onClose,
  onImportSuccess,
}: ImportExportDialogProps) {
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  
  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<ImportFormat>("ical");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  // Export state
  const [exportFormat, setExportFormat] = useState<ExportFormat>("ical");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  /**
   * Handle file selection for import
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  /**
   * Handle import submission
   */
  const handleImport = async () => {
    if (!importFile) {
      toast.error("Please select a file to import");
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("format", importFormat);

      const response = await fetch("/api/calendar/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      setImportResult(data.result);

      if (data.result.success > 0) {
        toast.success(
          `Successfully imported ${data.result.success} event(s)`
        );
        onImportSuccess();
      }

      if (data.result.failed > 0) {
        toast.error(`${data.result.failed} event(s) failed to import`);
      }

      if (data.result.duplicates > 0) {
        toast(`${data.result.duplicates} duplicate(s) skipped`, {
          icon: "ℹ️",
        });
      }
    } catch (err) {
      console.error("Import error:", err);
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Handle export
   */
  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const response = await fetch(
        `/api/calendar/export?format=${exportFormat}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Export failed");
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Set filename based on format
      const timestamp = new Date().toISOString().split("T")[0];
      const extension = exportFormat === "ical" ? "ics" : exportFormat;
      a.download = `calendar-events-${timestamp}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Calendar exported successfully");
    } catch (err) {
      console.error("Export error:", err);
      const errorMessage = err instanceof Error ? err.message : "Export failed";
      setExportError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Reset import state
   */
  const resetImport = () => {
    setImportFile(null);
    setImportResult(null);
    setImportFormat("ical");
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!isImporting && !isExporting) {
      resetImport();
      setExportError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import/Export Calendar Events</DialogTitle>
          <DialogDescription>
            Import events from external sources or export your calendar data
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="import-format">Format</Label>
                <Select
                  value={importFormat}
                  onValueChange={(v) => setImportFormat(v as ImportFormat)}
                  disabled={isImporting}
                >
                  <SelectTrigger id="import-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ical">iCal (.ics)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="json">JSON (.json)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="import-file">File</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept={
                    importFormat === "ical"
                      ? ".ics"
                      : importFormat === "csv"
                      ? ".csv"
                      : ".json"
                  }
                  onChange={handleFileChange}
                  disabled={isImporting}
                />
                {importFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {importFile.name}
                  </p>
                )}
              </div>

              {/* Import Result */}
              {importResult && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">Import Summary:</p>
                      <ul className="text-sm space-y-1">
                        <li>✓ Successfully imported: {importResult.success}</li>
                        {importResult.duplicates > 0 && (
                          <li>ℹ Duplicates skipped: {importResult.duplicates}</li>
                        )}
                        {importResult.failed > 0 && (
                          <li className="text-destructive">
                            ✗ Failed: {importResult.failed}
                          </li>
                        )}
                      </ul>
                      {importResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-semibold">Errors:</p>
                          <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                            {importResult.errors.slice(0, 5).map((err, idx) => (
                              <li key={idx} className="text-destructive">
                                Row {err.row}: {err.error}
                              </li>
                            ))}
                            {importResult.errors.length > 5 && (
                              <li className="text-muted-foreground">
                                ... and {importResult.errors.length - 5} more
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleImport}
                  disabled={!importFile || isImporting}
                  className="flex-1"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Events
                    </>
                  )}
                </Button>
                {importResult && (
                  <Button
                    variant="outline"
                    onClick={resetImport}
                    disabled={isImporting}
                  >
                    Reset
                  </Button>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <p className="font-semibold mb-1">Import Notes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Duplicate events (same title, date, time) will be skipped</li>
                    <li>Invalid data will be reported in the summary</li>
                    <li>All imported events will be visible to admins by default</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="export-format">Format</Label>
                <Select
                  value={exportFormat}
                  onValueChange={(v) => setExportFormat(v as ExportFormat)}
                  disabled={isExporting}
                >
                  <SelectTrigger id="export-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ical">iCal (.ics)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="json">JSON (.json)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {exportError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{exportError}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export All Events
                  </>
                )}
              </Button>

              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <p className="font-semibold mb-1">Export Notes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>All calendar events will be exported</li>
                    <li>Event visibility settings will be preserved</li>
                    <li>Recurring event rules will be included</li>
                    <li>File will be downloaded to your device</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
