"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataExportButton, ExportField } from "./data-export-button";
import { ExportProgressDialog } from "./export-progress-dialog";
import {
  smartExport,
  shouldUseBackgroundExport,
  BackgroundExportOptions,
} from "@/lib/utils/background-export";
import { ExportFormat } from "@/lib/utils/export";
import { showSuccessToast, showErrorToast, showInfoToast } from "@/lib/utils/toast-utils";

interface SmartExportButtonProps {
  data: any[];
  filename: string;
  title?: string;
  subtitle?: string;
  fields?: ExportField[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function SmartExportButton({
  data,
  filename,
  title,
  subtitle,
  fields,
  variant = "outline",
  size = "default",
  className,
}: SmartExportButtonProps) {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  const handleExport = async (format: ExportFormat, selectedFields?: string[]) => {
    // Filter data by selected fields if provided
    let exportData = data;
    if (selectedFields && selectedFields.length > 0) {
      exportData = data.map(row => {
        const filtered: any = {};
        selectedFields.forEach(key => {
          filtered[key] = row[key];
        });
        return filtered;
      });
    }

    // Check if we should use background export
    const useBackground = shouldUseBackgroundExport(exportData.length);

    if (useBackground) {
      // Show notification about background processing
      showInfoToast(`Processing ${exportData.length.toLocaleString()} records in the background. This may take a moment.`);
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${timestamp}`;

    const options: BackgroundExportOptions = {
      filename: fullFilename,
      title,
      subtitle,
      includeTimestamp: true,
      onProgress: (progress) => {
        // Progress updates are handled by the dialog
      },
      onComplete: (job) => {
        showSuccessToast(`Successfully exported ${job.totalRecords.toLocaleString()} records`);
      },
      onError: (error) => {
        showErrorToast(error.message);
      },
    };

    try {
      const job = await smartExport(exportData, format, options);
      
      if (job) {
        // Background export started
        setCurrentJobId(job.id);
        setShowProgress(true);
      } else {
        // Immediate export completed
        showSuccessToast(`Data exported as ${format.toUpperCase()} successfully`);
      }
    } catch (error) {
      console.error("Export error:", error);
      showErrorToast(error instanceof Error ? error.message : "Failed to export data");
    }
  };

  return (
    <>
      <DataExportButton
        data={data}
        filename={filename}
        title={title}
        subtitle={subtitle}
        fields={fields}
        onExport={handleExport}
        variant={variant}
        size={size}
        className={className}
      />

      <ExportProgressDialog
        jobId={currentJobId}
        open={showProgress}
        onOpenChange={setShowProgress}
      />
    </>
  );
}
