# Data Export Features

## Overview

This document describes the data export functionality for the Student Promotion and Alumni Management system. The export features allow administrators to export promotion history and alumni data in multiple formats (PDF and Excel).

## Requirements

- **8.6**: Support exporting promotion history reports to PDF or Excel
- **10.5**: Support generating custom alumni reports with selected fields and filters
- **10.6**: Support PDF and Excel export formats for alumni reports

## Features

### 1. Promotion History Export

Export complete promotion history with filters to PDF or Excel format.

**Location**: `/admin/academic/promotion/history`

**Component**: `PromotionHistoryExportButton`

**Features**:
- Export all promotion records with filters
- Includes: promotion date, source/target classes, student counts, executor details
- Supports PDF (landscape) and Excel formats
- Applies current filters (academic year, date range)
- Audit logging for all exports

**Usage**:
```tsx
import { PromotionHistoryExportButton } from "@/components/admin/promotion/promotion-history-export-button";

<PromotionHistoryExportButton
  filters={{
    academicYear: "2023-2024",
    startDate: new Date("2023-01-01"),
    endDate: new Date("2023-12-31"),
  }}
/>
```

### 2. Alumni Directory Export

Export alumni directory with search and filter criteria to PDF or Excel format.

**Location**: `/admin/alumni`

**Component**: `AlumniDirectoryExportButton`

**Features**:
- Export filtered alumni directory
- Includes: admission ID, name, graduation details, current occupation, contact info
- Supports PDF (landscape) and Excel formats
- Applies current search and filter criteria
- Audit logging for all exports

**Usage**:
```tsx
import { AlumniDirectoryExportButton } from "@/components/admin/alumni/alumni-directory-export-button";

<AlumniDirectoryExportButton
  filters={{
    searchTerm: "John",
    graduationYearFrom: 2020,
    graduationYearTo: 2023,
    finalClass: "Grade 12",
  }}
/>
```

### 3. Alumni Report Generation

Generate comprehensive alumni reports with custom filters.

**Location**: Various admin pages

**Component**: `AlumniReportExportButton`

**Features**:
- Generate custom alumni reports
- Filter by graduation year range and class
- Includes comprehensive alumni data
- Supports PDF and Excel formats
- Audit logging for all reports

**Usage**:
```tsx
import { AlumniReportExportButton } from "@/components/admin/alumni/alumni-report-export-button";

<AlumniReportExportButton
  filters={{
    graduationYearFrom: 2020,
    graduationYearTo: 2023,
    finalClass: "Grade 12",
  }}
  variant="default"
  size="default"
/>
```

## Server Actions

### exportPromotionHistory

Exports promotion history with filters.

**Parameters**:
- `filters` (optional): Filter criteria (academic year, class, date range)
- `format`: Export format ("pdf" or "excel")

**Returns**:
- Export data formatted for client-side generation
- Includes filename, title, subtitle

**Example**:
```typescript
const result = await exportPromotionHistory(
  {
    academicYear: "2023-2024",
    startDate: new Date("2023-01-01"),
    endDate: new Date("2023-12-31"),
  },
  "excel"
);
```

### exportAlumniDirectory

Exports alumni directory with search and filter criteria.

**Parameters**:
- `filters`: Search and filter criteria
- `format`: Export format ("pdf" or "excel")

**Returns**:
- Export data formatted for client-side generation
- Includes filename, title, subtitle

**Example**:
```typescript
const result = await exportAlumniDirectory(
  {
    searchTerm: "John",
    graduationYearFrom: 2020,
    graduationYearTo: 2023,
    page: 1,
    pageSize: 10000,
  },
  "pdf"
);
```

### generateAlumniReport

Generates comprehensive alumni reports.

**Parameters**:
- `input`: Report filters and format
  - `graduationYearFrom` (optional): Start year
  - `graduationYearTo` (optional): End year
  - `finalClass` (optional): Class filter
  - `format`: Export format ("pdf" or "excel")

**Returns**:
- Report data formatted for export
- Includes filename, title, subtitle

**Example**:
```typescript
const result = await generateAlumniReport({
  graduationYearFrom: 2020,
  graduationYearTo: 2023,
  finalClass: "Grade 12",
  format: "excel",
});
```

## Export Utilities

The export functionality uses the existing `exportReport` utility from `@/lib/utils/export`:

**Supported Formats**:
- **PDF**: Landscape orientation, includes title and subtitle
- **Excel**: Auto-sized columns, formatted headers
- **CSV**: Comma-separated values (legacy support)

**Features**:
- Automatic filename generation with timestamps
- Column auto-sizing for Excel
- Professional formatting for PDF
- Error handling and user feedback

## Audit Logging

All export operations are logged for audit purposes:

**Logged Information**:
- User ID
- Action type (EXPORT)
- Resource type (PROMOTION_HISTORY, ALUMNI)
- Export format
- Filter criteria
- Record count
- Timestamp

**Example Audit Log**:
```json
{
  "userId": "user123",
  "action": "EXPORT",
  "resource": "ALUMNI",
  "changes": {
    "operation": "EXPORT_ALUMNI_DIRECTORY",
    "format": "excel",
    "filters": {
      "graduationYearFrom": 2020,
      "graduationYearTo": 2023
    },
    "recordCount": 150
  }
}
```

## Security

**Authorization**:
- Promotion history export: ADMIN role required
- Alumni directory export: ADMIN or TEACHER role required
- Alumni report generation: ADMIN role required

**Data Protection**:
- All exports respect user permissions
- Sensitive data is included only for authorized users
- Export operations are rate-limited
- All exports are logged for audit trails

## Performance Considerations

**Large Datasets**:
- Exports are processed server-side
- Large datasets (>1000 records) may take several seconds
- Loading indicators are shown during export
- Exports are limited to 10,000 records per operation

**Optimization**:
- Database queries use indexes for performance
- Pagination is disabled for exports (fetch all matching records)
- Export data is formatted efficiently
- Client-side generation uses streaming where possible

## Error Handling

**Common Errors**:
- No data to export: User-friendly message shown
- Export timeout: Retry with smaller dataset
- Permission denied: Redirect to login or show error
- Server error: Generic error message with logging

**User Feedback**:
- Loading toast during export preparation
- Success toast on completion
- Error toast with actionable message
- Progress indication for large exports

## Future Enhancements

**Planned Features**:
- Scheduled exports (daily, weekly, monthly)
- Email delivery of exports
- Custom field selection for exports
- Export templates
- Batch export for multiple filters
- Export history and re-download

## Testing

**Manual Testing**:
1. Navigate to promotion history page
2. Apply filters (optional)
3. Click "Export" button
4. Select format (PDF or Excel)
5. Verify file downloads correctly
6. Open file and verify data accuracy

**Test Cases**:
- Export with no filters
- Export with date range filter
- Export with academic year filter
- Export with no data (should show error)
- Export as PDF
- Export as Excel
- Export with large dataset (>100 records)

## Troubleshooting

**Issue**: Export button is disabled
- **Solution**: Ensure there is data to export

**Issue**: Export fails with error
- **Solution**: Check browser console for details, verify permissions

**Issue**: PDF formatting is incorrect
- **Solution**: Verify data doesn't contain special characters, check PDF generation settings

**Issue**: Excel file won't open
- **Solution**: Verify Excel is installed, try opening with Google Sheets or LibreOffice

## Related Documentation

- [Export Utilities](../src/lib/utils/export.ts)
- [Promotion Actions](../src/lib/actions/promotionActions.ts)
- [Alumni Actions](../src/lib/actions/alumniActions.ts)
- [Audit Logging](./AUDIT_LOGGING_QUICK_REFERENCE.md)
