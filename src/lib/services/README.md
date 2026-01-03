# Report Card Data Aggregation Service

## Overview

The Report Card Data Aggregation Service provides a comprehensive solution for aggregating all data needed for report card generation. It consolidates student information, exam results with mark breakdowns, co-scholastic grades, attendance data, and remarks into a single, structured data object.

## Features

- **Complete Data Aggregation**: Fetches and structures all required data for report cards
- **Mark Component Breakdown**: Supports theory, practical, and internal assessment marks
- **Co-scholastic Integration**: Includes non-academic assessments
- **Attendance Calculation**: Integrates attendance data with configurable thresholds
- **Performance Calculations**: Automatically calculates overall performance, percentages, and grades
- **Batch Processing**: Supports batch aggregation for multiple students
- **Error Handling**: Comprehensive error handling with meaningful error messages

## Usage

### Single Student Report Card Data

```typescript
import { aggregateReportCardData } from '@/lib/services/report-card-data-aggregation';

// Aggregate data for a single student
const reportCardData = await aggregateReportCardData(studentId, termId);

console.log(reportCardData);
// {
//   student: { id, name, admissionId, rollNumber, class, section, ... },
//   term: { id, name, startDate, endDate, academicYear },
//   subjects: [
//     {
//       subjectName: "Mathematics",
//       theoryMarks: 80,
//       practicalMarks: 18,
//       totalMarks: 98,
//       maxMarks: 100,
//       percentage: 98,
//       grade: "A+",
//       ...
//     },
//     ...
//   ],
//   coScholastic: [...],
//   attendance: { percentage: 95.5, daysPresent: 191, totalDays: 200, ... },
//   overallPerformance: { totalMarks: 450, maxMarks: 500, percentage: 90, grade: "A+", rank: 5 },
//   remarks: { teacherRemarks: "...", principalRemarks: "..." }
// }
```

### Batch Report Card Data

```typescript
import { batchAggregateReportCardData } from '@/lib/services/report-card-data-aggregation';

// Aggregate data for multiple students
const studentIds = ['student1', 'student2', 'student3'];
const reportCardDataArray = await batchAggregateReportCardData(studentIds, termId);

// Process each student's data
reportCardDataArray.forEach(data => {
  console.log(`Report card for ${data.student.name}`);
  console.log(`Overall percentage: ${data.overallPerformance.percentage}%`);
});
```

### Using Server Actions

```typescript
import { getReportCardData, getBatchReportCardData, getClassReportCardData } from '@/lib/actions/report-card-aggregation-actions';

// Get data for a single student
const result = await getReportCardData(studentId, termId);
if (result.success) {
  const reportCardData = result.data;
  // Use the data...
}

// Get data for multiple students
const batchResult = await getBatchReportCardData(studentIds, termId);
if (batchResult.success) {
  const reportCardDataArray = batchResult.data;
  // Process the data...
}

// Get data for all students in a class
const classResult = await getClassReportCardData(classId, termId, sectionId);
if (classResult.success) {
  const reportCardDataArray = classResult.data;
  // Generate batch report cards...
}
```

## Data Structure

### ReportCardData Interface

```typescript
interface ReportCardData {
  student: StudentInfo;
  term: TermInfo;
  academicYear: string;
  subjects: SubjectResult[];
  coScholastic: CoScholasticResult[];
  attendance: AttendanceData;
  overallPerformance: OverallPerformance;
  remarks: RemarksInfo;
  templateId: string | null;
  pdfUrl: string | null;
  isPublished: boolean;
  publishDate: Date | null;
}
```

### SubjectResult Interface

```typescript
interface SubjectResult {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  theoryMarks: number | null;
  theoryMaxMarks: number | null;
  practicalMarks: number | null;
  practicalMaxMarks: number | null;
  internalMarks: number | null;
  internalMaxMarks: number | null;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string | null;
  isAbsent: boolean;
}
```

### OverallPerformance Interface

```typescript
interface OverallPerformance {
  totalMarks: number;
  maxMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string | null;
  rank: number | null;
}
```

## Requirements Validation

This service fulfills the following requirements from the specification:

- **Requirement 5.2**: Populates report card template with student data, marks, grades, and attendance
- **Requirement 10.1**: Provides text fields for teacher remarks
- **Requirement 10.2**: Provides text fields for principal remarks (up to 500 characters)
- **Requirement 10.3**: Persists remarks to database linked to report card
- **Requirement 10.4**: Includes remarks in the report card data structure

## Performance Considerations

- **Parallel Data Fetching**: Uses `Promise.all()` to fetch data in parallel for better performance
- **Batch Processing**: Supports batch aggregation for multiple students to reduce database queries
- **Efficient Queries**: Uses selective field selection to minimize data transfer
- **Error Handling**: Gracefully handles missing data and provides meaningful error messages

## Error Handling

The service throws descriptive errors for common issues:

- Student not found
- Term not found
- No active enrollment found
- Database connection errors

Always wrap service calls in try-catch blocks or use the server actions which return structured error responses.

## Testing

The service includes comprehensive unit tests for calculation logic:

```bash
# Run unit tests
npm test src/lib/services/__tests__/report-card-calculations.test.ts
```

## Future Enhancements

- Configurable grade scales (currently uses hardcoded scale)
- Support for multiple grading systems (CBSE, State Board, etc.)
- Caching for frequently accessed data
- Webhook notifications on report card generation
- Multi-language support for report cards
