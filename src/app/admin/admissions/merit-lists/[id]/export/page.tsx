"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMeritListById } from "@/lib/actions/meritListActions";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useParams } from "next/navigation";

export default function ExportMeritListPage() {
  const params = useParams();
  const id = params.id as string;
  const [meritList, setMeritList] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getMeritListById(id);
        setMeritList(data);
      } catch (error) {
        console.error("Error fetching merit list:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleExportCSV = () => {
    if (!meritList) return;

    setExporting(true);
    try {
      // Create CSV content
      const headers = [
        "Rank",
        "Application Number",
        "Student Name",
        "Date of Birth",
        "Gender",
        "Parent Name",
        "Parent Email",
        "Parent Phone",
        "Previous School",
        "Submitted Date",
        "Score",
        "Status",
      ];
      const rows = meritList.entries.map((entry: any) => [
        entry.rank,
        entry.application.applicationNumber,
        entry.application.studentName,
        format(new Date(entry.application.dateOfBirth), "yyyy-MM-dd"),
        entry.application.gender,
        entry.application.parentName,
        entry.application.parentEmail,
        entry.application.parentPhone,
        entry.application.previousSchool || "N/A",
        format(new Date(entry.application.submittedAt), "yyyy-MM-dd"),
        entry.score.toFixed(2),
        entry.application.status,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: any[]) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `merit-list-${meritList.appliedClass.name.replace(/\s+/g, "-")}-${format(
        new Date(meritList.generatedAt),
        "yyyy-MM-dd"
      )}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    if (!meritList) return;

    setExporting(true);
    try {
      // Create a printable HTML page
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow popups to export PDF");
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Merit List - ${meritList.appliedClass.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            h1 {
              text-align: center;
              color: #1a1a1a;
              margin-bottom: 10px;
            }
            .subtitle {
              text-align: center;
              color: #666;
              margin-bottom: 30px;
            }
            .info {
              margin-bottom: 20px;
              padding: 15px;
              background: #f5f5f5;
              border-radius: 5px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px 8px;
              text-align: left;
            }
            th {
              background-color: #4a5568;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .rank {
              font-weight: bold;
              color: #2563eb;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body {
                margin: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>Merit List - ${meritList.appliedClass.name}</h1>
          <div class="subtitle">
            ${meritList.config.name}<br>
            Generated on ${format(new Date(meritList.generatedAt), "MMMM dd, yyyy 'at' h:mm a")}
          </div>
          
          <div class="info">
            <div class="info-row">
              <strong>Total Applications:</strong>
              <span>${meritList.totalApplications}</span>
            </div>
            <div class="info-row">
              <strong>Configuration:</strong>
              <span>${meritList.config.name}</span>
            </div>
            <div class="info-row">
              <strong>Ranking Criteria:</strong>
              <span>${(meritList.config.criteria as any[])
                .map(
                  (c) =>
                    `${c.field === "submittedAt" ? "Submission Date" : "Date of Birth"} (${
                      c.weight
                    }%)`
                )
                .join(", ")}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 60px;">Rank</th>
                <th>Application #</th>
                <th>Student Name</th>
                <th>Parent Name</th>
                <th>Parent Contact</th>
                <th>Submitted</th>
                <th style="width: 80px;">Score</th>
              </tr>
            </thead>
            <tbody>
              ${meritList.entries
                .map(
                  (entry: any) => `
                <tr>
                  <td class="rank">#${entry.rank}</td>
                  <td>${entry.application.applicationNumber}</td>
                  <td>${entry.application.studentName}</td>
                  <td>${entry.application.parentName}</td>
                  <td>
                    ${entry.application.parentEmail}<br>
                    <small>${entry.application.parentPhone}</small>
                  </td>
                  <td>${format(new Date(entry.application.submittedAt), "MMM dd, yyyy")}</td>
                  <td>₹{entry.score.toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="footer">
            <p>This is an official merit list generated by the School ERP System</p>
            <p>Generated on ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}</p>
          </div>

          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
              Print / Save as PDF
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px;">
              Close
            </button>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[300px]" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!meritList) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/admissions/merit-lists">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Merit List Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/admissions/merit-lists/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Export Merit List</h1>
          <p className="text-muted-foreground">
            {meritList.config.name} - {meritList.appliedClass.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export to CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download the merit list as a CSV file. This format is ideal for importing into
              spreadsheet applications like Excel or Google Sheets.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Includes all application details</li>
              <li>Easy to filter and sort</li>
              <li>Compatible with all spreadsheet software</li>
            </ul>
            <Button onClick={handleExportCSV} disabled={exporting} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Download CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Export to PDF
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a printable PDF version of the merit list. This format is ideal for
              official documentation and sharing.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Professional formatting</li>
              <li>Ready for printing</li>
              <li>Includes school branding</li>
            </ul>
            <Button onClick={handleExportPDF} disabled={exporting} className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              {exporting ? "Generating..." : "Generate PDF"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Merit List Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Total Applications</div>
              <div className="text-2xl font-bold">{meritList.totalApplications}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Configuration</div>
              <div className="text-lg font-medium">{meritList.config.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Generated On</div>
              <div className="text-lg font-medium">
                {format(new Date(meritList.generatedAt), "MMM dd, yyyy")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
