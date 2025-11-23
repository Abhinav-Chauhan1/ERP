"use client";


import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportBuilderForm } from "@/components/admin/reports/report-builder-form";
import { ReportPreview } from "@/components/admin/reports/report-preview";
import { ExportButton } from "@/components/admin/reports/export-button";
import { ArrowLeft, Save, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { saveReportConfig, generateReport } from "@/lib/actions/reportBuilderActions";
import toast from "react-hot-toast";

export interface ReportConfig {
  name: string;
  dataSource: string;
  selectedFields: string[];
  filters: ReportFilter[];
  sorting: ReportSort[];
  chartConfig?: ChartConfig;
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: string;
}

export interface ReportSort {
  field: string;
  direction: "asc" | "desc";
}

export interface ChartConfig {
  enabled: boolean;
  type: "bar" | "line" | "pie" | "area";
  xAxisField: string;
  yAxisField: string;
  aggregation?: "sum" | "average" | "count" | "min" | "max";
  groupBy?: string;
}

export default function ReportBuilderPage() {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: "",
    dataSource: "",
    selectedFields: [],
    filters: [],
    sorting: [],
    chartConfig: {
      enabled: false,
      type: "bar",
      xAxisField: "",
      yAxisField: "",
    },
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);

  const handleSaveReport = async () => {
    if (!reportConfig.name) {
      toast.error("Please enter a report name");
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveReportConfig(reportConfig);
      if (result.success) {
        toast.success("Report configuration saved successfully");
      } else {
        toast.error(result.error || "Failed to save report");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportConfig.dataSource || reportConfig.selectedFields.length === 0) {
      toast.error("Please select a data source and at least one field");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateReport(reportConfig);
      if (result.success && result.data) {
        setReportData(result.data);
        setShowPreview(true);
        toast.success(`Generated report with ${result.data.length} records`);
      } else {
        toast.error(result.error || "Failed to generate report");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Custom Report Builder</h1>
            <p className="text-muted-foreground mt-1">
              Create custom reports with drag-and-drop field selection
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveReport} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Report
          </Button>
          <Button onClick={handleGenerateReport} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>
              Configure your custom report by selecting data sources, fields, filters, and sorting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportBuilderForm
              config={reportConfig}
              onChange={setReportConfig}
            />
          </CardContent>
        </Card>

        {showPreview && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Report Preview</CardTitle>
                  <CardDescription>
                    Preview of your report based on current configuration
                  </CardDescription>
                </div>
                <ExportButton
                  reportConfig={reportConfig}
                  reportData={reportData}
                  disabled={!reportData || reportData.length === 0}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ReportPreview config={reportConfig} data={reportData} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

