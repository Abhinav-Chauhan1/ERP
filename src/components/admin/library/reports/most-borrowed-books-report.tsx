"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { convertToCSV, downloadCSV, generateFilename } from "@/lib/utils/export-utils";

interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  quantity: number;
  available: number;
}

interface MostBorrowedBook {
  book: Book | null | undefined;
  borrowCount: number;
}

interface MostBorrowedBooksReportProps {
  data: MostBorrowedBook[];
}

export function MostBorrowedBooksReport({ data }: MostBorrowedBooksReportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const exportData = data.map((item, index) => ({
        Rank: index + 1,
        Title: item.book?.title || "N/A",
        Author: item.book?.author || "N/A",
        ISBN: item.book?.isbn || "N/A",
        Category: item.book?.category || "N/A",
        "Total Copies": item.book?.quantity || 0,
        "Times Borrowed": item.borrowCount,
      }));

      const csv = convertToCSV(
        exportData,
        ["Rank", "Title", "Author", "ISBN", "Category", "Total Copies", "Times Borrowed"]
      );

      downloadCSV(csv, generateFilename("most_borrowed_books", "csv"));
    } catch (error) {
      console.error("Error exporting to CSV:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      // Create a printable version
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow popups to export PDF");
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Most Borrowed Books Report</title>
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
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
              }
              th {
                background-color: #f4f4f4;
                font-weight: bold;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <h1>Most Borrowed Books Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>ISBN</th>
                  <th>Category</th>
                  <th>Total Copies</th>
                  <th>Times Borrowed</th>
                </tr>
              </thead>
              <tbody>
                ${data
                  .map(
                    (item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.book?.title || "N/A"}</td>
                    <td>${item.book?.author || "N/A"}</td>
                    <td>${item.book?.isbn || "N/A"}</td>
                    <td>${item.book?.category || "N/A"}</td>
                    <td>${item.book?.quantity || 0}</td>
                    <td>${item.borrowCount}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="footer">
              <p>Total Books: ${data.length}</p>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load before printing
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No data available for this report
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
            <CardTitle>Most Borrowed Books</CardTitle>
            <CardDescription>
              Top {data.length} most popular books in the library
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
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Total Copies</TableHead>
                <TableHead className="text-right">Times Borrowed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={item.book?.id || index}>
                  <TableCell className="font-medium">
                    {index + 1 <= 3 ? (
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                    ) : (
                      `#${index + 1}`
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.book?.title || "N/A"}
                  </TableCell>
                  <TableCell>{item.book?.author || "N/A"}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.book?.isbn || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.book?.category || "N/A"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.book?.quantity || 0}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {item.borrowCount}
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
