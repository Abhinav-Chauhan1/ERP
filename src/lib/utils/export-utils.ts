/**
 * Utility functions for exporting data to various formats
 */

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: any[], headers: string[]): string {
  if (!data || data.length === 0) {
    return headers.join(",");
  }

  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(","));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return "";
      }
      
      // Handle dates
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      
      // Handle strings with commas or quotes
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });
    
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return "Invalid Date";
  
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format currency
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "₹0.00";
  
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().split("T")[0];
  return `${prefix}_${timestamp}.${extension}`;
}
