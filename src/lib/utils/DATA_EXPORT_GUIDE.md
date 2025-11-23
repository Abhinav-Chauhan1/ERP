# Data Export Functionality Guide

## Overview

The ERP system provides comprehensive data export functionality supporting CSV, Excel, and PDF formats. The system automatically handles both small and large datasets, using background processing for exports exceeding 1,000 records.

## Features

### 1. Multi-Format Export
- **CSV**: Comma-separated values for spreadsheet applications
- **Excel**: Native XLSX format with formatting and metadata
- **PDF**: Print-ready documents with tables and optional charts

### 2. Field Selection
- Users can choose which fields to include in exports
- Select/deselect all functionality
- Remembers field selections during session

### 3. Background Processing
- Automatic detection of large datasets (>1,000 records)
- Non-blocking export processing
- Progress tracking with real-time updates
- Notification on completion

### 4. Smart Filename Generation
- Automatic timestamp inclusion
- Descriptive naming based on data type
- Format: `{entity}_{date}.{extension}`

## Components

### SmartExportButton

The main export component with automatic background processing.

```tsx
import { SmartExportButton } from "@/components/shared/smart-export-button";
import { ExportField } from "@/components/shared/data-export-button";

// Define exportable fields
const exportFields: ExportField[] = [
  { key: "id", label: "ID", selected: true },
  { key: "name", label: "Name", selected: true },
  { key: "email", label: "Email", selected: true },
  { key: "status", label: "Status", selected: false },
];

// Prepare data for export
const exportData = data.map(item => ({
  id: item.id,
  name: item.name,
  email: item.email,
  status: item.active ? "Active" : "Inactive",
}));

// Use in component
<SmartExportButton
  data={exportData}
  filename="users"
  title="Users List"
  subtitle="All registered users"
  fields={exportFields}
/>
```

### DataExportButton

Basic export button without background processing (for small datasets).

```tsx
import { DataExportButton } from "@/components/shared/data-export-button";

<DataExportButton
  data={exportData}
  filename="report"
  title="Monthly Report"
  variant="outline"
  size="default"
/>
```

### ExportProgressDialog

Shows progress for background exports.

```tsx
import { ExportProgressDialog } from "@/components/shared/export-progress-dialog";

<ExportProgressDialog
  jobId={currentJobId}
  open={showProgress}
  onOpenChange={setShowProgress}
/>
```

## Usage Examples

### Example 1: Students List Export

```tsx
"use client";

import { SmartExportButton } from "@/components/shared/smart-export-button";
import { ExportField } from "@/components/shared/data-export-button";

export function StudentsTable({ students }) {
  // Prepare export data
  const exportData = students.map(student => ({
    admissionId: student.admissionId,
    firstName: student.user.firstName,
    lastName: student.user.lastName,
    class: student.enrollments[0]?.class.name || "N/A",
    section: student.enrollments[0]?.section.name || "N/A",
    status: student.user.active ? "Active" : "Inactive",
  }));

  // Define fields
  const exportFields: ExportField[] = [
    { key: "admissionId", label: "Admission ID", selected: true },
    { key: "firstName", label: "First Name", selected: true },
    { key: "lastName", label: "Last Name", selected: true },
    { key: "class", label: "Class", selected: true },
    { key: "section", label: "Section", selected: true },
    { key: "status", label: "Status", selected: true },
  ];

  return (
    <div>
      <SmartExportButton
        data={exportData}
        filename="students"
        title="Students List"
        subtitle={`Total: ${students.length} students`}
        fields={exportFields}
      />
      {/* Table content */}
    </div>
  );
}
```

### Example 2: Attendance Report Export

```tsx
export function AttendanceReport({ attendance }) {
  const exportData = attendance.map(record => ({
    date: formatDate(record.date),
    studentName: `${record.student.user.firstName} ${record.student.user.lastName}`,
    class: record.section.class.name,
    section: record.section.name,
    status: record.status,
    remarks: record.remarks || "",
  }));

  const exportFields: ExportField[] = [
    { key: "date", label: "Date", selected: true },
    { key: "studentName", label: "Student Name", selected: true },
    { key: "class", label: "Class", selected: true },
    { key: "section", label: "Section", selected: true },
    { key: "status", label: "Status", selected: true },
    { key: "remarks", label: "Remarks", selected: false },
  ];

  return (
    <SmartExportButton
      data={exportData}
      filename="attendance_report"
      title="Attendance Report"
      subtitle={`${attendance.length} records`}
      fields={exportFields}
    />
  );
}
```

### Example 3: Fee Payments Export

```tsx
export function FeePaymentsTable({ payments }) {
  const exportData = payments.map(payment => ({
    receiptNumber: payment.receiptNumber,
    studentName: `${payment.student.user.firstName} ${payment.student.user.lastName}`,
    amount: payment.amount,
    paymentDate: formatDate(payment.paymentDate),
    paymentMethod: payment.paymentMethod,
    status: payment.status,
  }));

  return (
    <SmartExportButton
      data={exportData}
      filename="fee_payments"
      title="Fee Payments"
      subtitle={`Total: ₹${payments.reduce((sum, p) => sum + p.amount, 0)}`}
    />
  );
}
```

## Server-Side Export Actions

For very large datasets or when you need server-side processing:

```tsx
"use server";

import { exportStudentsData } from "@/lib/actions/export-actions";

// In your component
const handleServerExport = async () => {
  const result = await exportStudentsData({
    status: "active",
    searchQuery: searchTerm,
  });

  if (result.success) {
    // Handle success
    console.log(`Prepared ${result.recordCount} records for export`);
  } else {
    // Handle error
    console.error(result.error);
  }
};
```

## Background Export API

### Check if background export is needed

```typescript
import { shouldUseBackgroundExport } from "@/lib/utils/background-export";

if (shouldUseBackgroundExport(data.length)) {
  // Use background export
} else {
  // Use immediate export
}
```

### Create background export job

```typescript
import { createBackgroundExportJob } from "@/lib/utils/background-export";

const job = await createBackgroundExportJob(data, "excel", {
  filename: "large_dataset",
  title: "Large Dataset Export",
  chunkSize: 500,
  onProgress: (progress) => {
    console.log(`Progress: ${progress}%`);
  },
  onComplete: (job) => {
    console.log("Export completed!");
  },
  onError: (error) => {
    console.error("Export failed:", error);
  },
});
```

### Track job status

```typescript
import { getJobStatus, getAllJobs } from "@/lib/utils/background-export";

// Get specific job
const job = getJobStatus(jobId);

// Get all jobs
const allJobs = getAllJobs();

// Clear completed jobs
clearCompletedJobs();
```

## Export Utilities

### Direct Export Functions

```typescript
import { exportReport, exportToCSV, exportToExcel, exportToPDF } from "@/lib/utils/export";

// Export to CSV
exportToCSV(data, {
  filename: "report",
  title: "Monthly Report",
});

// Export to Excel
exportToExcel(data, {
  filename: "report",
  title: "Monthly Report",
  subtitle: "January 2025",
});

// Export to PDF
exportToPDF(data, {
  filename: "report",
  title: "Monthly Report",
  orientation: "landscape",
  includeTimestamp: true,
});

// Generic export
exportReport(data, "pdf", {
  filename: "report",
  title: "Report Title",
});
```

## Best Practices

### 1. Data Preparation

Always prepare clean, flat data for export:

```typescript
// Good
const exportData = students.map(s => ({
  id: s.id,
  name: `${s.user.firstName} ${s.user.lastName}`,
  class: s.enrollments[0]?.class.name || "N/A",
}));

// Avoid nested objects
const badData = students; // Contains nested user, enrollments, etc.
```

### 2. Field Selection

Provide meaningful field labels:

```typescript
const exportFields: ExportField[] = [
  { key: "admissionId", label: "Admission ID", selected: true },
  { key: "fullName", label: "Full Name", selected: true },
  // Not: { key: "admissionId", label: "admissionId" }
];
```

### 3. Large Datasets

For datasets over 1,000 records, use SmartExportButton which automatically handles background processing:

```typescript
// Automatically uses background processing for large datasets
<SmartExportButton data={largeDataset} filename="export" />
```

### 4. Error Handling

Always handle export errors gracefully:

```typescript
<SmartExportButton
  data={data}
  filename="export"
  onExport={async (format, fields) => {
    try {
      // Custom export logic
    } catch (error) {
      showErrorToast("Export failed");
    }
  }}
/>
```

### 5. Performance

- Filter data before exporting (don't export unnecessary records)
- Use field selection to reduce export size
- Consider pagination for very large datasets

## Troubleshooting

### Export button is disabled

- Check if data array is empty
- Verify data is properly formatted

### Background export not triggering

- Ensure dataset has more than 1,000 records
- Check browser console for errors

### PDF export missing data

- Verify all data fields are serializable
- Check for circular references in data objects

### Excel export formatting issues

- Ensure column widths are reasonable
- Check for special characters in data

## Requirements Validation

This implementation satisfies the following requirements:

- ✅ **25.1**: Support export to CSV, Excel, and PDF formats
- ✅ **25.2**: Process large exports in background with notifications
- ✅ **25.3**: Allow field selection for exports
- ✅ **25.4**: Maintain formatting in PDF exports
- ✅ **25.5**: Generate descriptive filenames with timestamps

## Related Files

- `/src/components/shared/data-export-button.tsx` - Basic export button
- `/src/components/shared/smart-export-button.tsx` - Smart export with background processing
- `/src/components/shared/export-progress-dialog.tsx` - Progress tracking UI
- `/src/lib/utils/export.ts` - Core export utilities
- `/src/lib/utils/background-export.ts` - Background processing logic
- `/src/lib/actions/export-actions.ts` - Server-side export actions
