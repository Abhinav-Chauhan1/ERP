"use client";

/**
 * Promotion History Export Button
 * 
 * Provides export functionality for promotion history with PDF and Excel support.
 * 
 * Requirements: 8.6
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
import { exportPromotionHistory } from "@/lib/actions/promotionActions";
import { exportReport, ExportFormat } from "@/lib/utils/export";
import { showSuccessToast, showErrorToast } from "@/lib/utils/toast-utils";

interface PromotionHistoryExportButtonProps {
  filters?: {
    academicYear?: string;
    classId?: string;
    startDate?: Date;
    endDate?: Date;
  };
  disabled?: boolean;
}

export function PromotionHistoryExportButton({
  filters,
  disabled = false,
}: PromotionHistoryExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setExportingFormat(format);

    try {
      // Call server action to get export data
      const result = await exportPromotionHistory(filters, format);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to export promotion history");
      }

      const { exportData, filename, title, subtitle } = result.data;

      if (exportData.length === 0) {
        showErrorToast("No promotion history to export");
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

      showSuccessToast(`Promotion history exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error("Export error:", error);
      showErrorToast(error instanceof Error ? error.message : "Failed to export promotion history");
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
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
              Export
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
