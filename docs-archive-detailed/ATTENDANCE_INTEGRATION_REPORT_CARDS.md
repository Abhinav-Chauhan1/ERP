# Attendance Integration for Report Cards

## Overview

This document describes the attendance integration feature for the offline exam marks and report card system. The feature provides comprehensive attendance tracking and display capabilities for report cards, including percentage calculations, threshold-based highlighting, and detailed breakdowns.

## Features

### 1. Attendance Calculation

The system calculates attendance percentage from `StudentAttendance` records for a specific term:

- **Accurate Calculation**: Considers all attendance statuses (PRESENT, ABSENT, LATE, HALF_DAY, LEAVE)
- **Smart Counting**: 
  - PRESENT and LATE count as full days
  - HALF_DAY counts as 0.5 days
  - LEAVE counts as full days (excused absence)
  - ABSENT does not count toward attendance
- **Percentage Precision**: Rounded to 2 decimal places

### 2. Threshold-Based Highlighting

The system automatically highlights low attendance:

- **Default Threshold**: 75%
- **Customizable**: Can be configured per institution
- **Visual Indicators**: Color-coded badges and icons
- **Warning Messages**: Displayed when attendance is below threshold

### 3. Detailed Breakdown

Provides comprehensive attendance information:

- Days present
- Days absent
- Days late
- Half days
- Leave days (excused)
- Total school days
- Attendance percentage

### 4. Graceful Error Handling

- Returns default values when no attendance data exists
- Displays "N/A" or "Not Available" for missing data
- Allows report card generation even with incomplete attendance
- Logs errors for debugging

## Implementation

### Core Utilities

#### `attendance-calculator.ts`

Located at: `src/lib/utils/attendance-calculator.ts`

**Key Functions:**

1. **`calculateAttendanceForTerm(studentId, termId, threshold?)`**
   - Fetches attendance records for a student within a term's date range
   - Returns complete `AttendanceData` object
   - Handles missing data gracefully

2. **`calculateAttendanceFromRecords(records, threshold?)`**
   - Pure calculation function for testing
   - Takes array of attendance records
   - Returns calculated attendance data

3. **`formatAttendanceForDisplay(attendanceData)`**
   - Formats attendance for display: "85.50% (171/200 days)"
   - Returns "N/A" for missing data

4. **`getAttendanceSummary(attendanceData)`**
   - Generates human-readable summary
   - Includes all attendance components

5. **`batchCalculateAttendance(studentIds, termId, threshold?)`**
   - Efficiently calculates attendance for multiple students
   - Returns Map of studentId to AttendanceData
   - Optimized for batch report card generation

**Data Structure:**

```typescript
interface AttendanceData {
  percentage: number;
  daysPresent: number;
  totalDays: number;
  daysAbsent: number;
  daysLate: number;
  daysHalfDay: number;
  daysLeave: number;
  isLowAttendance: boolean;
}
```

### Server Actions

#### Updated `reportCardsActions.ts`

**New Function:**

```typescript
export async function getAttendanceForReportCard(
  studentId: string, 
  termId: string
)
```

Returns attendance data with display text for a specific student and term.

**Updated Function:**

```typescript
export async function generateReportCard(
  studentId: string, 
  termId: string
)
```

Now uses `calculateAttendanceForTerm()` instead of placeholder calculation.

### UI Components

#### `AttendanceDisplay` Component

Located at: `src/components/admin/report-cards/attendance-display.tsx`

**Features:**
- Full card display with detailed breakdown
- Color-coded status indicators (Excellent, Good, Needs Improvement)
- Threshold-based highlighting
- Warning messages for low attendance
- Tooltips for additional information

**Props:**

```typescript
interface AttendanceDisplayProps {
  percentage: number;
  daysPresent: number;
  totalDays: number;
  daysAbsent?: number;
  daysLate?: number;
  daysHalfDay?: number;
  daysLeave?: number;
  isLowAttendance?: boolean;
  lowAttendanceThreshold?: number;
  showDetails?: boolean;
  className?: string;
}
```

**Status Levels:**
- **Excellent**: ≥90% (Green)
- **Good**: ≥75% (Blue)
- **Needs Improvement**: <75% (Red)
- **No Data**: 0 days (Gray)

#### `AttendanceDisplayCompact` Component

Compact version for tables and lists:
- Shows percentage with icon
- Tooltip with details
- Minimal space usage

#### `ReportCardView` Component

Located at: `src/components/admin/report-cards/report-card-view.tsx`

Example implementation showing:
- How to fetch attendance data
- How to display attendance in report cards
- Integration with other report card sections
- Loading states and error handling

## Usage Examples

### 1. Calculate Attendance for a Student

```typescript
import { calculateAttendanceForTerm } from '@/lib/utils/attendance-calculator';

const attendanceData = await calculateAttendanceForTerm(
  'student-id',
  'term-id',
  75 // optional threshold
);

console.log(attendanceData.percentage); // 85.50
console.log(attendanceData.isLowAttendance); // false
```

### 2. Display Attendance in Report Card

```typescript
import { AttendanceDisplay } from '@/components/admin/report-cards/attendance-display';

<AttendanceDisplay
  percentage={attendanceData.percentage}
  daysPresent={attendanceData.daysPresent}
  totalDays={attendanceData.totalDays}
  daysAbsent={attendanceData.daysAbsent}
  daysLate={attendanceData.daysLate}
  daysHalfDay={attendanceData.daysHalfDay}
  daysLeave={attendanceData.daysLeave}
  isLowAttendance={attendanceData.isLowAttendance}
  showDetails={true}
/>
```

### 3. Batch Calculate for Class

```typescript
import { batchCalculateAttendance } from '@/lib/utils/attendance-calculator';

const studentIds = ['id1', 'id2', 'id3'];
const attendanceMap = await batchCalculateAttendance(studentIds, 'term-id');

for (const [studentId, data] of attendanceMap) {
  console.log(`${studentId}: ${data.percentage}%`);
}
```

### 4. Format for Display

```typescript
import { formatAttendanceForDisplay } from '@/lib/utils/attendance-calculator';

const displayText = formatAttendanceForDisplay(attendanceData);
// Output: "85.50% (171/200 days)"
```

## Testing

### Unit Tests

Located at: `src/lib/utils/__tests__/attendance-calculator.test.ts`

**Test Coverage:**
- ✅ Empty records handling
- ✅ 100% attendance calculation
- ✅ Mixed attendance calculation
- ✅ LATE status counting
- ✅ HALF_DAY status (0.5 days)
- ✅ LEAVE status (excused)
- ✅ Low attendance detection
- ✅ Custom threshold support
- ✅ Percentage rounding
- ✅ Display formatting
- ✅ Summary generation

**Run Tests:**

```bash
npm run test -- src/lib/utils/__tests__/attendance-calculator.test.ts --run
```

All 19 tests pass successfully.

## Database Schema

The feature uses the existing `StudentAttendance` model:

```prisma
model StudentAttendance {
  id        String           @id @default(cuid())
  student   Student          @relation(fields: [studentId], references: [id])
  studentId String
  date      DateTime
  section   ClassSection     @relation(fields: [sectionId], references: [id])
  sectionId String
  status    AttendanceStatus @default(PRESENT)
  reason    String?
  markedBy  String?
  createdAt DateTime         @default(now())
  updatedAt DateTime         @default(now())

  @@unique([studentId, date, sectionId])
  @@index([studentId, date])
  @@index([sectionId, date, status])
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  HALF_DAY
  LEAVE
}
```

## Requirements Validation

This implementation satisfies all requirements from the specification:

### ✅ Requirement 11.1
**WHEN generating a report card THEN the system SHALL calculate attendance percentage for the term from the StudentAttendance table**

Implemented in `calculateAttendanceForTerm()` function.

### ✅ Requirement 11.2
**WHEN attendance data is incomplete THEN the system SHALL display a warning but allow report card generation**

Handled gracefully - returns default values and displays "N/A" when no data exists.

### ✅ Requirement 11.3
**WHEN displaying attendance THEN the system SHALL show both percentage and days present out of total days**

Implemented in `AttendanceDisplay` component and `formatAttendanceForDisplay()` function.

### ✅ Requirement 11.4
**WHEN attendance is below threshold THEN the system SHALL highlight it in the report card**

Implemented with `isLowAttendance` flag and visual highlighting in `AttendanceDisplay` component.

### ✅ Requirement 11.5
**WHEN no attendance data exists THEN the system SHALL display "N/A" or "Not Available"**

Implemented in all display functions and components.

## Performance Considerations

### Optimizations

1. **Batch Processing**: `batchCalculateAttendance()` fetches all records in one query
2. **Date Range Filtering**: Only fetches records within term dates
3. **Indexed Queries**: Uses existing database indexes on `[studentId, date]`
4. **Caching**: Results can be cached at the report card level

### Scalability

- Handles large datasets efficiently
- Minimal database queries
- Pure calculation functions for testing
- Suitable for batch report card generation

## Future Enhancements

Potential improvements for future versions:

1. **Attendance Trends**: Show attendance trends over multiple terms
2. **Comparison**: Compare student attendance with class average
3. **Alerts**: Automated alerts for declining attendance
4. **Export**: Include attendance details in exported reports
5. **Custom Thresholds**: Per-class or per-grade thresholds
6. **Attendance Goals**: Set and track attendance improvement goals

## Troubleshooting

### Common Issues

**Issue**: Attendance shows 0% even with records
- **Solution**: Check that records fall within term date range
- **Check**: Verify term startDate and endDate are correct

**Issue**: Low attendance not highlighted
- **Solution**: Verify threshold parameter is passed correctly
- **Default**: System uses 75% threshold by default

**Issue**: Missing attendance data
- **Solution**: System handles gracefully - displays "N/A"
- **Action**: Ensure attendance is being marked regularly

## Support

For issues or questions:
1. Check test files for usage examples
2. Review component props and function signatures
3. Check console logs for error messages
4. Verify database records exist for the term

## Changelog

### Version 1.0.0 (2024-12-24)
- Initial implementation
- Core calculation utilities
- UI components
- Comprehensive test coverage
- Documentation
