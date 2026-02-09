# Marks Import Guide

## Overview

The Marks Import feature allows administrators and teachers to bulk import student marks from Excel or CSV files. This feature supports theory, practical, and internal assessment marks, along with absent status and remarks.

## Features

- **Multiple File Formats**: Support for CSV (.csv) and Excel (.xlsx, .xls) files
- **Data Validation**: Comprehensive validation before import
- **Preview Before Import**: Review parsed data before committing
- **Error Reporting**: Detailed error messages for failed rows
- **Audit Logging**: All imports are logged for tracking
- **Template Download**: Download a template file to see the required format

## File Format

### Required Columns

The import file must contain at least one of the following student identifiers:
- `studentId` or `student_id` or `StudentID` - The unique student ID from the database
- `rollNumber` or `roll_number` or `RollNumber` - The student's roll number

### Optional Columns

- `name` or `studentName` or `Name` - Student name (for reference only)
- `theoryMarks` or `theory_marks` or `Theory` - Theory marks (numeric)
- `practicalMarks` or `practical_marks` or `Practical` - Practical marks (numeric)
- `internalMarks` or `internal_marks` or `Internal` - Internal assessment marks (numeric)
- `isAbsent` or `is_absent` or `Absent` - Absent status (true/false, yes/no, 1/0)
- `remarks` or `Remarks` - Additional remarks (text)

### Example CSV Format

```csv
studentId,rollNumber,name,theoryMarks,practicalMarks,internalMarks,isAbsent,remarks
student-id-1,001,John Doe,85,90,18,false,Good performance
student-id-2,002,Jane Smith,78,85,16,false,
student-id-3,003,Bob Johnson,,,,,true,Absent due to illness
```

### Example Excel Format

| studentId | rollNumber | name | theoryMarks | practicalMarks | internalMarks | isAbsent | remarks |
|-----------|------------|------|-------------|----------------|---------------|----------|---------|
| student-id-1 | 001 | John Doe | 85 | 90 | 18 | false | Good performance |
| student-id-2 | 002 | Jane Smith | 78 | 85 | 16 | false | |
| student-id-3 | 003 | Bob Johnson | | | | true | Absent due to illness |

## Validation Rules

### File Validation

1. **File Type**: Must be CSV, XLSX, or XLS format
2. **File Size**: Maximum 10MB
3. **Structure**: Must have header row with column names

### Data Validation

1. **Student Identification**:
   - At least one of `studentId` or `rollNumber` must be provided
   - Student must exist in the database

2. **Marks Validation**:
   - Marks must be numeric (integers or decimals)
   - Marks must be non-negative (≥ 0)
   - Marks must not exceed the configured maximum for each component
   - Empty marks are treated as null (not entered)

3. **Absent Status**:
   - If a student is marked absent, marks validation is skipped
   - Absent students will have null marks and grades

4. **Remarks**:
   - Optional text field
   - No character limit during import (but may be truncated in database)

## Import Process

### Step 1: Select File

1. Navigate to the Marks Entry page
2. Select the exam, class, and section
3. Click "Load Students" to view the marks entry grid
4. Click "Import from File" button
5. Download the template if needed
6. Select your CSV or Excel file

### Step 2: Preview Data

1. The system will parse the file and display a preview
2. Review the parsed data in the preview table
3. Check for validation errors (highlighted in red)
4. If errors exist, fix them in the source file and re-upload

### Step 3: Import

1. If no validation errors, click "Import Marks"
2. The system will process each row and save to the database
3. View the import summary showing:
   - Total rows processed
   - Successfully imported rows
   - Failed rows with error details

### Step 4: Review Results

1. Review the import summary
2. Check error details for any failed rows
3. Fix failed rows manually or re-import with corrections
4. Close the dialog to return to the marks entry grid

## Error Handling

### Common Errors

1. **Student Not Found**
   - Error: "Student not found with provided ID or roll number"
   - Solution: Verify the studentId or rollNumber exists in the database

2. **Marks Exceed Maximum**
   - Error: "Theory marks (95) exceed maximum (80)"
   - Solution: Ensure marks don't exceed the configured maximum for the exam

3. **Invalid Marks Format**
   - Error: "Theory marks must be a non-negative number"
   - Solution: Ensure marks are numeric and non-negative

4. **Missing Required Fields**
   - Error: "Either studentId or rollNumber is required"
   - Solution: Provide at least one student identifier

### Partial Import

- If some rows fail validation, the import will continue for valid rows
- Failed rows will be reported in the error details
- You can fix and re-import failed rows without affecting already imported data

## Best Practices

1. **Use the Template**: Download and use the provided template to ensure correct format

2. **Test with Small Files**: Test with a small file (5-10 rows) before importing large datasets

3. **Backup Data**: Export existing marks before importing to have a backup

4. **Verify Student IDs**: Ensure student IDs or roll numbers match the database exactly

5. **Check Mark Configuration**: Verify the subject mark configuration is set up before importing

6. **Review Preview**: Always review the preview before confirming import

7. **Handle Errors Promptly**: Fix validation errors immediately rather than importing partial data

## Audit Trail

All imports are logged in the audit log with:
- User who performed the import
- Timestamp of import
- Exam and subject details
- Student details and marks imported
- Source: "file_import"

To view audit logs:
1. Navigate to Admin > Audit Logs
2. Filter by action: "MARKS_IMPORT"
3. Filter by exam or date range as needed

## Troubleshooting

### File Won't Upload

- Check file size (must be < 10MB)
- Verify file extension (.csv, .xlsx, .xls)
- Try saving the file in a different format

### All Rows Failing

- Verify column names match the expected format
- Check that the file has a header row
- Ensure student IDs or roll numbers are correct

### Marks Not Calculating

- Verify the subject mark configuration is set up
- Check that marks are within the configured maximums
- Ensure the exam total marks is configured correctly

### Import Slow

- Large files (>1000 rows) may take several seconds
- The system processes rows sequentially for data integrity
- Consider breaking very large files into smaller batches

## API Reference

### Import Marks Action

```typescript
import { importMarksFromFile } from "@/lib/actions/importMarksActions";

const result = await importMarksFromFile({
  examId: "exam-id",
  subjectId: "subject-id",
  data: [
    {
      studentId: "student-1",
      rollNumber: "001",
      theoryMarks: 85,
      practicalMarks: 90,
      internalMarks: 18,
      isAbsent: false,
      remarks: "Good performance",
    },
  ],
});

// Result structure
{
  success: boolean;
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: Array<{
    row: number;
    studentIdentifier: string;
    message: string;
  }>;
  error?: string;
}
```

## Related Documentation

- [Marks Entry Guide](./MARKS_ENTRY_GUIDE.md)
- [Subject Mark Configuration](./SUBJECT_MARK_CONFIG_GUIDE.md)
- [Grade Calculation](./GRADE_CALCULATION_GUIDE.md)
- [Audit Logging](./AUDIT_LOGGING_GUIDE.md)
