"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { convertToCSV, downloadCSV, generateFilename, formatDate, formatCurrency } from "@/lib/utils/export-utils";

interface FineIssue {
  id: string;
  issueDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  fine: number;
  daysOverdue: number;
  book: {
    title: string;
    author: string;
    isbn: string;
  };
  student: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    section?: {
      name: string;
      class: {
        name: string;
      };
    };
  };
}

interface FineCollectionsReportProps {
  data: {
    fineIssues: FineIssue[];
    total: number;
    totalFinesCollected: number;
    totalPages: number;
  };
}

export function FineCollectionsReport({ data }: FineCollectionsReportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const exportData = data.fineIssues.map((issue) => ({
        "Student Name": `${issue.student.user.firstName} ${issue.student.user.lastName}`,
        "Student Email": issue.student.user.email,
        Class: issue.student.section
          ? `${issue.student.section.class.name} - ${issue.student.section.name}`
          : "N/A",
        "Book Title": issue.book.title,
        Author: issue.book.author,
        ISBN: issue.book.isbn,
        "Issue Date": formatDate(issue.issueDate),
        "Due Date": formatDate(issue.dueDate),
        "Return Date": formatDate(issue.returnDate),
        "Days Overdue": issue.daysOverdue,
        "Fine Collected": issue.fine,
      }));

      const csv = convertToCSV(exportData, [
        "Student Name",
        "Student Email",
        "Class",
        "Book Title",
        "Author",
        "ISBN",
        "Issue Date",
        "Due Date",
        "Return Date",
        "Days Overdue",
        "Fine Collected",
      ]);

      downloadCSV(csv, generateFilename("fine_collections", "csv"));
    } catch (error) {
      console.error("Error exporting to CSV:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow popups to export PDF");
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Fine Collections Report</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
              }
              h1 {
                color: #333;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
              }
              .summary {
                background-color: #f4f4f4;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                font-size: 11px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f4f4f4;
                font-weight: bold;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .fine {
                color: #16a34a;
                font-weight: bold;
              }
              .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <h1>Fine Collections Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <div class="summary">
              <p><strong>Total Fines Collected:</strong> ${formatCurrency(data.totalFinesCollected)}</p>
              <p><strong>Number of Transactions:</strong> ${data.total}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Book Title</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Days Overdue</th>
                  <th>Fine</th>
                </tr>
              </thead>
              <tbody>
                ${data.fineIssues
                  .map(
                    (issue) => `
                  <tr>
                    <td>${issue.student.user.firstName} ${issue.student.user.lastName}</td>
                    <td>${
                      issue.student.section
                        ? `${issue.student.section.class.name} - ${issue.student.section.name}`
                        : "N/A"
                    }</td>
                    <td>${issue.book.title}</td>
                    <td>${formatDate(issue.dueDate)}</td>
                    <td>${formatDate(issue.returnDate)}</td>
                    <td>${issue.daysOverdue}</td>
                    <td class="fine">${formatCurrency(issue.fine)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="footer">
              <p>Note: Fines are calculated at ₹5 per day overdue</p>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!data.fineIssues || data.fineIssues.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No fines have been collected yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fine Collections</CardTitle>
            <CardDescription>
              {data.total} transaction{data.total !== 1 ? "s" : ""} • Total collected:{" "}
              {formatCurrency(data.totalFinesCollected)}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={isExporting}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              disabled={isExporting}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Book</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead className="text-right">Days Overdue</TableHead>
                <TableHead className="text-right">Fine Collected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.fineIssues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{issue.student.user.firstName} {issue.student.user.lastName}</p>
                      <p className="text-sm text-muted-foreground">
                        {issue.student.user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {issue.student.section ? (
                      <Badge variant="outline">
                        {issue.student.section.class.name} -{" "}
                        {issue.student.section.name}
                      </Badge>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{issue.book.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {issue.book.author}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(issue.dueDate)}</TableCell>
                  <TableCell>{formatDate(issue.returnDate)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{issue.daysOverdue} days</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatCurrency(issue.fine)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
