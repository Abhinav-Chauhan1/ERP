"use client";

/**
 * Alumni Report Export Button
 * 
 * Provides export functionality for alumni reports with PDF and Excel support.
 * 
 * Requirements: 10.5, 10.6
 */

import { useState } from "react";
import { Download, FileSpreadsheet, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { generateAlumniReport } from "@/lib/actions/alumniActions";
import { exportReport, ExportFormat } from "@/lib/utils/export";
import { showSuccessToast, showErrorToast } from "@/lib/utils/toast-utils";

interface AlumniReportExportButtonProps {
  filters?: {
    graduationYearFrom?: number;
    graduationYearTo?: number;
    finalClass?: string;
  };
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AlumniReportExportButton({
  filters = {},
  disabled = false,
  variant = "outline",
  size = "default",
}: AlumniReportExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  const handleExport = async (format: "pdf" | "excel") => {
    setIsExporting(true);
    setExportingFormat(format);

    try {
      // Call server action to get report data
      const result = await generateAlumniReport({
        ...filters,
        format,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to generate alumni report");
      }

      const { exportData, filename, title, subtitle } = result.data;

      if (exportData.length === 0) {
        showErrorToast("No alumni data to export");
        return;
      }

      // Use the export utility to generate the file
      exportReport(exportData, format, {
        filename,
        title,
        subtitle,
        includeTimestamp: true,
        orientation: format === "pdf" ? "landscape" : undefined,
      });

      showSuccessToast(`Alumni report exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error("Export error:", error);
      showErrorToast(error instanceof Error ? error.message : "Failed to export alumni report");
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport("excel")}
          disabled={isExporting}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {exportingFormat === "excel" ? "Exporting..." : "Export as Excel"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("pdf")}
          disabled={isExporting}
        >
          <File className="h-4 w-4 mr-2" />
          {exportingFormat === "pdf" ? "Exporting..." : "Export as PDF"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
