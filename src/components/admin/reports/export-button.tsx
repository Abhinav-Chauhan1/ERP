"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, FileDown, Loader2 } from "lucide-react";
import { exportReport, ExportFormat } from "@/lib/utils/export";
import { exportReportData } from "@/lib/actions/reportBuilderActions";
import { ReportConfig } from "@/lib/actions/reportBuilderActions";
import toast from "react-hot-toast";

interface ExportButtonProps {
  reportConfig: ReportConfig;
  reportData?: any[];
  disabled?: boolean;
}

export function ExportButton({ reportConfig, reportData, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      setExportingFormat(format);

      let dataToExport = reportData;

      // If no data provided, fetch from server
      if (!dataToExport) {
        const result = await exportReportData(reportConfig, format);
        
        if (!result.success || !result.data) {
          toast.error(result.error || "Failed to export report");
          return;
        }

        dataToExport = result.data;
      }

      // Perform client-side export
      exportReport(
        dataToExport,
        format,
        {
          filename: `${reportConfig.name.replace(/\s+/g, '_')}_${Date.now()}`,
          title: reportConfig.name,
          subtitle: `Data Source: ${reportConfig.dataSource}`,
          includeTimestamp: true,
          orientation: format === 'pdf' ? 'landscape' : 'portrait',
        }
      );

      toast.success(`Report exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error(`Failed to export report as ${format.toUpperCase()}`);
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
          className="gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting {exportingFormat?.toUpperCase()}...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isExporting}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="gap-2"
        >
          <FileDown className="h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
