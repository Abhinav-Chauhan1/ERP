"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { exportReport, ExportFormat, ExportOptions } from "@/lib/utils/export";
import { showSuccessToast, showErrorToast } from "@/lib/utils/toast-utils";

export interface ExportField {
  key: string;
  label: string;
  selected?: boolean;
}

interface DataExportButtonProps {
  data: any[];
  filename: string;
  title?: string;
  subtitle?: string;
  fields?: ExportField[];
  onExport?: (format: ExportFormat, selectedFields?: string[]) => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function DataExportButton({
  data,
  filename,
  title,
  subtitle,
  fields,
  onExport,
  variant = "outline",
  size = "default",
  className,
}: DataExportButtonProps) {
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(fields?.filter(f => f.selected !== false).map(f => f.key) || [])
  );
  const [isExporting, setIsExporting] = useState(false);

  const handleExportClick = (format: ExportFormat) => {
    if (fields && fields.length > 0) {
      // Show field selector dialog
      setSelectedFormat(format);
      setShowFieldSelector(true);
    } else {
      // Export directly without field selection
      performExport(format, data);
    }
  };

  const handleFieldToggle = (fieldKey: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldKey)) {
      newSelected.delete(fieldKey);
    } else {
      newSelected.add(fieldKey);
    }
    setSelectedFields(newSelected);
  };

  const handleSelectAll = () => {
    if (fields) {
      setSelectedFields(new Set(fields.map(f => f.key)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedFields(new Set());
  };

  const performExport = async (format: ExportFormat, exportData: any[]) => {
    if (exportData.length === 0) {
      showErrorToast("No data available to export");
      return;
    }

    setIsExporting(true);

    try {
      // Filter data by selected fields if applicable
      let filteredData = exportData;
      if (selectedFields.size > 0 && fields) {
        filteredData = exportData.map(row => {
          const filtered: any = {};
          selectedFields.forEach(key => {
            filtered[key] = row[key];
          });
          return filtered;
        });
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fullFilename = `${filename}_${timestamp}`;

      const options: ExportOptions = {
        filename: fullFilename,
        title,
        subtitle,
        includeTimestamp: true,
      };

      // Call custom export handler if provided
      if (onExport) {
        onExport(format, Array.from(selectedFields));
      } else {
        // Use default export
        exportReport(filteredData, format, options);
      }

      showSuccessToast(`Data exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error("Export error:", error);
      showErrorToast(error instanceof Error ? error.message : "Failed to export data");
    } finally {
      setIsExporting(false);
      setShowFieldSelector(false);
    }
  };

  const handleConfirmExport = () => {
    if (selectedFields.size === 0) {
      showErrorToast("Please select at least one field to export");
      return;
    }

    if (selectedFormat) {
      performExport(selectedFormat, data);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            disabled={isExporting || data.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Export Format</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleExportClick("csv")}>
            <FileText className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportClick("excel")}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportClick("pdf")}>
            <File className="h-4 w-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showFieldSelector} onOpenChange={setShowFieldSelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Fields to Export</DialogTitle>
            <DialogDescription>
              Choose which fields you want to include in the export.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex-1"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                className="flex-1"
              >
                Deselect All
              </Button>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-3 border rounded-md p-4">
              {fields?.map((field) => (
                <div key={field.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.key}
                    checked={selectedFields.has(field.key)}
                    onCheckedChange={() => handleFieldToggle(field.key)}
                  />
                  <Label
                    htmlFor={field.key}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="text-sm text-muted-foreground">
              {selectedFields.size} of {fields?.length || 0} fields selected
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFieldSelector(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmExport} disabled={isExporting}>
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
