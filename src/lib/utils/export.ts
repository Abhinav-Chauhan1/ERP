/**
 * Multi-format export utilities for reports
 * Supports PDF, Excel (XLSX), and CSV formats
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToExcel as exportToExcelJS } from './excel';
import Papa from 'papaparse';

export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface ExportOptions {
  filename: string;
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  includeTimestamp?: boolean;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: any[];
  xKey?: string;
  yKey?: string;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(
  data: any[],
  options: ExportOptions
): void {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Convert data to CSV
  const csv = Papa.unparse(data);

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${options.filename}.csv`);
}

/**
 * Export data to Excel format using ExcelJS
 */
export async function exportToExcel(
  data: any[],
  options: ExportOptions
): Promise<void> {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Use ExcelJS for secure Excel export
  await exportToExcelJS(data, {
    filename: options.filename,
    title: options.title,
    subtitle: options.subtitle,
    includeTimestamp: options.includeTimestamp,
  });
}

/**
 * Export data to PDF format with optional charts
 */
export function exportToPDF(
  data: any[],
  options: ExportOptions,
  charts?: ChartData[]
): void {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Create PDF document
  const doc = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yPosition = 20;

  // Add title
  if (options.title) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(options.title, 14, yPosition);
    yPosition += 10;
  }

  // Add subtitle
  if (options.subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(options.subtitle, 14, yPosition);
    yPosition += 8;
  }

  // Add timestamp
  if (options.includeTimestamp !== false) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
      `Generated on: ${new Date().toLocaleString()}`,
      14,
      yPosition
    );
    yPosition += 10;
  }

  // Extract columns from data
  const columns = Object.keys(data[0]).map((key) => ({
    header: formatHeader(key),
    dataKey: key,
  }));

  // Add table
  autoTable(doc, {
    startY: yPosition,
    head: [columns.map((col) => col.header)],
    body: data.map((row) => columns.map((col) => formatCellValue(row[col.dataKey]))),
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 10, right: 14, bottom: 10, left: 14 },
  });

  // Add charts if provided
  if (charts && charts.length > 0) {
    // Note: For actual chart rendering in PDF, you would need to:
    // 1. Render charts to canvas using a library like Chart.js
    // 2. Convert canvas to image
    // 3. Add image to PDF
    // This is a placeholder for chart support
    const finalY = (doc as any).lastAutoTable.finalY || yPosition;
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Charts and Visualizations', 14, 20);
    doc.setFontSize(10);
    doc.text(
      'Note: Chart rendering in PDF requires additional setup.',
      14,
      30
    );
  }

  // Save PDF
  doc.save(`${options.filename}.pdf`);
}



/**
 * Format header text (convert camelCase to Title Case)
 */
function formatHeader(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Format cell value for display
 */
function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Main export function that handles all formats
 */
export async function exportReport(
  data: any[],
  format: ExportFormat,
  options: ExportOptions,
  charts?: ChartData[]
): Promise<void> {
  try {
    switch (format) {
      case 'csv':
        exportToCSV(data, options);
        break;
      case 'excel':
        await exportToExcel(data, options);
        break;
      case 'pdf':
        exportToPDF(data, options, charts);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
}
