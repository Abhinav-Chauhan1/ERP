"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeeStructureAnalyticsComponent } from "@/components/fees/fee-structure-analytics";
import { getAcademicYears } from "@/lib/actions/academicyearsActions";
import { getClasses } from "@/lib/actions/classesActions";
import { getFeeStructureAnalytics } from "@/lib/actions/feeStructureActions";
import { exportToExcel as exportToExcelJS } from "@/lib/utils/excel";
import toast from "react-hot-toast";

export default function AnalyticsPage() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [yearsResult, classesResult] = await Promise.all([
        getAcademicYears(),
        getClasses(),
      ]);

      if (yearsResult.success) {
        setAcademicYears(yearsResult.data || []);
      }

      if (classesResult.success) {
        setClasses(classesResult.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format: "csv" | "excel") {
    try {
      const result = await getFeeStructureAnalytics({});
      if (!result.success || !result.data) {
        toast.error("Failed to fetch analytics data for export");
        return;
      }

      const analytics = result.data;

      if (format === "csv") {
        exportToCSV(analytics);
      } else {
        exportToExcel(analytics);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  }

  function exportToCSV(analytics: any) {
    // Create CSV content for structure details
    const headers = [
      "Fee Structure Name",
      "Academic Year",
      "Classes",
      "Status",
      "Is Template",
      "Students Affected",
      "Total Amount (INR)",
      "Revenue Projection (INR)",
      "Created At",
    ];

    const rows = analytics.structureDetails.map((structure: any) => [
      structure.name,
      structure.academicYearName,
      structure.classNames.join("; "),
      structure.isActive ? "Active" : "Inactive",
      structure.isTemplate ? "Yes" : "No",
      structure.studentsAffected,
      structure.totalAmount,
      structure.revenueProjection,
      new Date(structure.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any[]) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `fee-structure-analytics-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Analytics exported to CSV");
  }

  async function exportToExcel(analytics: any) {
    // Prepare data for export
    const exportData = analytics.structureDetails.map((structure: any) => ({
      'Fee Structure Name': structure.name,
      'Academic Year': structure.academicYearName,
      'Classes': structure.classNames.join("; "),
      'Status': structure.isActive ? "Active" : "Inactive",
      'Is Template': structure.isTemplate ? "Yes" : "No",
      'Students Affected': structure.studentsAffected,
      'Total Amount (INR)': structure.totalAmount,
      'Revenue Projection (INR)': structure.revenueProjection,
      'Created At': new Date(structure.createdAt).toLocaleDateString(),
    }));

    // Use ExcelJS for export
    await exportToExcelJS(exportData, {
      filename: `fee-structure-analytics-${new Date().toISOString().split('T')[0]}`,
      title: 'Fee Structure Analytics',
      subtitle: `Total Structures: ${analytics.totalStructures} | Active: ${analytics.activeStructures}`,
      includeTimestamp: true,
    });

    toast.success("Analytics exported successfully");
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/finance/fee-structure">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Fee Analytics</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => handleExport("csv")} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("excel")} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Analytics Component */}
      {!loading && (
        <FeeStructureAnalyticsComponent
          academicYears={academicYears}
          classes={classes}
          onExport={handleExport}
        />
      )}
    </div>
  );
}
