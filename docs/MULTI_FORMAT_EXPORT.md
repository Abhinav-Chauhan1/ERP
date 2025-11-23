# Multi-Format Export Implementation

## Overview

This document describes the multi-format export functionality implemented for the School ERP system. The system now supports exporting reports in PDF, Excel (XLSX), and CSV formats.

## Features

### Supported Formats

1. **PDF Export**
   - Landscape and portrait orientation support
   - Automatic table formatting with headers
   - Title, subtitle, and timestamp inclusion
   - Styled headers with color
   - Alternating row colors for readability
   - Prepared for chart integration (placeholder implemented)

2. **Excel (XLSX) Export**
   - Automatic column width calculation
   - Workbook metadata (title, author, date)
   - Clean spreadsheet formatting
   - Compatible with Microsoft Excel and Google Sheets

3. **CSV Export**
   - Simple comma-separated values format
   - UTF-8 encoding support
   - Compatible with all spreadsheet applications
   - Lightweight and fast

## Implementation

### Core Files

1. **`src/lib/utils/export.ts`**
   - Main export utility functions
   - Format-specific export handlers
   - Data formatting and validation

2. **`src/components/admin/reports/export-button.tsx`**
   - Client-side export button component
   - Dropdown menu for format selection
   - Loading states and error handling

3. **`src/lib/actions/reportBuilderActions.ts`**
   - Server action for preparing export data
   - Integration with report generation

### Dependencies

- **jspdf**: PDF generation
- **jspdf-autotable**: Table formatting in PDFs
- **xlsx**: Excel file generation
- **papaparse**: CSV parsing and generation

## Usage

### In Report Builder

The export functionality is integrated into the Report Builder page:

```tsx
import { ExportButton } from "@/components/admin/reports/export-button";

<ExportButton
  reportConfig={reportConfig}
  reportData={reportData}
  disabled={!reportData || reportData.length === 0}
/>
```

### Programmatic Export

You can also use the export utilities directly:

```typescript
import { exportReport } from "@/lib/utils/export";

// Export to PDF
exportReport(data, 'pdf', {
  filename: 'my-report',
  title: 'Monthly Report',
  subtitle: 'January 2024',
  orientation: 'landscape',
  includeTimestamp: true,
});

// Export to Excel
exportReport(data, 'excel', {
  filename: 'my-report',
  title: 'Monthly Report',
});

// Export to CSV
exportReport(data, 'csv', {
  filename: 'my-report',
});
```

## Data Format

The export functions expect data in the following format:

```typescript
const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 25 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 30 },
  // ... more records
];
```

### Data Handling

- **Null/Undefined values**: Displayed as "N/A"
- **Objects**: Converted to JSON string
- **Arrays**: Converted to JSON string
- **Special characters**: Properly escaped
- **Unicode**: Full UTF-8 support

## Export Options

```typescript
interface ExportOptions {
  filename: string;              // Base filename (without extension)
  title?: string;                // Report title
  subtitle?: string;             // Report subtitle
  orientation?: 'portrait' | 'landscape';  // PDF orientation
  includeTimestamp?: boolean;    // Add generation timestamp
}
```

## Testing

Comprehensive unit tests are available in `src/lib/utils/export.test.ts`:

```bash
npm run test:run -- src/lib/utils/export.test.ts
```

Test coverage includes:
- All export formats (PDF, Excel, CSV)
- Error handling (empty data, invalid formats)
- Data formatting (null, undefined, objects, arrays)
- Edge cases (single record, large datasets, special characters)
- Unicode support

## Future Enhancements

### Chart Support in PDF

Currently, the PDF export has a placeholder for chart rendering. To fully implement:

1. Render charts to canvas using Chart.js or Recharts
2. Convert canvas to image (PNG/JPEG)
3. Embed image in PDF using jsPDF's `addImage()` method

Example implementation:

```typescript
// Render chart to canvas
const canvas = document.getElementById('myChart') as HTMLCanvasElement;
const imgData = canvas.toDataURL('image/png');

// Add to PDF
doc.addImage(imgData, 'PNG', 15, yPosition, 180, 100);
```

### Scheduled Exports

Future implementation will include:
- Scheduled report generation
- Automatic email delivery
- Cloud storage integration

### Advanced Formatting

Potential enhancements:
- Custom PDF templates
- Excel cell styling (colors, borders, fonts)
- Multi-sheet Excel workbooks
- PDF page numbers and headers/footers

## Performance Considerations

- **Large Datasets**: Exports are processed client-side. For very large datasets (>10,000 records), consider:
  - Server-side generation
  - Background processing
  - Pagination or chunking

- **Memory Usage**: PDF generation can be memory-intensive. Monitor browser memory for large reports.

- **File Size**: 
  - CSV: Smallest file size
  - Excel: Medium file size (compressed)
  - PDF: Largest file size (especially with formatting)

## Browser Compatibility

The export functionality works in all modern browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Opera

Note: File downloads may behave differently across browsers, but all support the Blob download method used.

## Troubleshooting

### Export Button Not Working

1. Check that `reportData` is not empty
2. Verify the report has been generated
3. Check browser console for errors

### PDF Not Formatting Correctly

1. Verify data structure matches expected format
2. Check for very long text values (may cause overflow)
3. Try landscape orientation for wide tables

### Excel File Won't Open

1. Ensure data doesn't contain invalid characters
2. Check that the file extension is `.xlsx`
3. Try opening with different spreadsheet applications

## Requirements Validation

This implementation satisfies **Requirement 10.2**:

> WHEN a report is generated THEN the ERP System SHALL support export to PDF, Excel, and CSV formats

✅ PDF export implemented with jsPDF
✅ Excel export implemented with xlsx library  
✅ CSV export implemented with papaparse
✅ Formatting and charts prepared for PDF exports
✅ All formats tested and working

## Related Documentation

- [Report Builder Implementation](./REPORT_BUILDER_IMPLEMENTATION.md)
- [Testing Strategy](../docs/TESTING_STRATEGY.md)
- [API Documentation](./API_DOCUMENTATION.md)
