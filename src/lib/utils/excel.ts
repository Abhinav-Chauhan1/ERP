/**
 * Excel utilities using ExcelJS (secure replacement for xlsx)
 * Provides Excel import/export functionality without security vulnerabilities
 */

import ExcelJS from 'exceljs';

export interface ExcelExportOptions {
  filename: string;
  title?: string;
  subtitle?: string;
  sheetName?: string;
  includeTimestamp?: boolean;
}

/**
 * Export data to Excel format using ExcelJS
 */
export async function exportToExcel(
  data: any[],
  options: ExcelExportOptions
): Promise<void> {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'SikshaMitra';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  if (options.title) {
    workbook.title = options.title;
    workbook.subject = options.subtitle || '';
  }

  const worksheet = workbook.addWorksheet(options.sheetName || 'Report Data');

  let currentRow = 1;

  // Add title if provided
  if (options.title) {
    worksheet.mergeCells(`A${currentRow}:${getColumnLetter(Object.keys(data[0]).length)}${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = options.title;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow += 2;
  }

  // Add subtitle if provided
  if (options.subtitle) {
    worksheet.mergeCells(`A${currentRow}:${getColumnLetter(Object.keys(data[0]).length)}${currentRow}`);
    const subtitleCell = worksheet.getCell(`A${currentRow}`);
    subtitleCell.value = options.subtitle;
    subtitleCell.font = { size: 12 };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow += 2;
  }

  // Add timestamp if requested
  if (options.includeTimestamp !== false) {
    worksheet.mergeCells(`A${currentRow}:${getColumnLetter(Object.keys(data[0]).length)}${currentRow}`);
    const timestampCell = worksheet.getCell(`A${currentRow}`);
    timestampCell.value = `Generated on: ${new Date().toLocaleString()}`;
    timestampCell.font = { size: 9, color: { argb: 'FF666666' } };
    timestampCell.alignment = { horizontal: 'center' };
    currentRow += 2;
  }

  // Extract columns from data
  const columns = Object.keys(data[0]).map((key) => ({
    header: formatHeader(key),
    key: key,
    width: calculateColumnWidth(key, data),
  }));

  // Set columns
  worksheet.columns = columns;

  // Style header row
  const headerRow = worksheet.getRow(currentRow);
  headerRow.values = columns.map(col => col.header);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2980B9' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 20;
  currentRow++;

  // Add data rows
  data.forEach((row, index) => {
    const excelRow = worksheet.getRow(currentRow + index);
    columns.forEach((col, colIndex) => {
      excelRow.getCell(colIndex + 1).value = formatCellValue(row[col.key]);
    });
    
    // Alternate row colors
    if (index % 2 === 1) {
      excelRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F5F5' },
      };
    }
  });

  // Add borders to all cells
  const lastRow = currentRow + data.length - 1;
  const lastCol = columns.length;
  for (let row = currentRow - 1; row <= lastRow; row++) {
    for (let col = 1; col <= lastCol; col++) {
      const cell = worksheet.getCell(row, col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    }
  }

  // Generate Excel file and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, `${options.filename}.xlsx`);
}

/**
 * Parse Excel file and return data
 */
export async function parseExcelFile(file: File): Promise<any[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in Excel file');
  }

  const data: any[] = [];
  const headers: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // First row is header
      row.eachCell((cell) => {
        headers.push(String(cell.value || '').trim());
      });
    } else {
      // Data rows
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] = cell.value;
        }
      });
      
      // Only add non-empty rows
      if (Object.keys(rowData).length > 0) {
        data.push(rowData);
      }
    }
  });

  return data;
}

/**
 * Create Excel template for import
 */
export async function createExcelTemplate(
  columns: Array<{ key: string; header: string; example?: any }>,
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SikshaMitra';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Template');

  // Set columns
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: Math.max(col.header.length + 5, 15),
  }));

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2980B9' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 20;

  // Add example rows if provided
  if (columns.some((col) => col.example !== undefined)) {
    const exampleRow = worksheet.addRow(
      columns.reduce((acc, col) => {
        acc[col.key] = col.example || '';
        return acc;
      }, {} as any)
    );
    exampleRow.font = { italic: true, color: { argb: 'FF666666' } };
  }

  // Generate Excel file and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, `${filename}.xlsx`);
}

/**
 * Helper: Get Excel column letter from number (1 = A, 2 = B, etc.)
 */
function getColumnLetter(colNumber: number): string {
  let letter = '';
  while (colNumber > 0) {
    const remainder = (colNumber - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    colNumber = Math.floor((colNumber - 1) / 26);
  }
  return letter;
}

/**
 * Helper: Calculate optimal column width
 */
function calculateColumnWidth(key: string, data: any[]): number {
  const headerLength = formatHeader(key).length;
  const maxDataLength = Math.max(
    ...data.map((row) => {
      const value = row[key];
      return value ? String(value).length : 0;
    })
  );
  return Math.min(Math.max(headerLength, maxDataLength) + 2, 50);
}

/**
 * Helper: Format header text (convert camelCase to Title Case)
 */
function formatHeader(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Helper: Format cell value for display
 */
function formatCellValue(value: any): any {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object' && !(value instanceof Date)) {
    return JSON.stringify(value);
  }
  return value;
}

/**
 * Helper: Download blob as file
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