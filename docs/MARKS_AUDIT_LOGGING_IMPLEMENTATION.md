# Marks Entry Audit Logging Implementation

## Overview

This document describes the implementation of comprehensive audit logging for marks entry and modification in the School ERP system.

## Requirements Addressed

### Requirement 14.1: Audit Log Creation
✅ **Implemented**: Audit logs are automatically created when marks are entered or modified using the `logCreate` and `logUpdate` functions from `src/lib/utils/audit-log.ts`.

### Requirement 14.2: Last Modified Display
✅ **Implemented**: The marks entry grid displays last modified date and user information for each student's marks entry with a tooltip showing detailed information.

### Requirement 14.3: Audit Log Filtering
✅ **Implemented**: The audit log viewer provides comprehensive filtering options:
- Filter by exam
- Filter by student ID
- Filter by date range (start and end date)
- Pagination support

### Requirement 14.4: Before/After Values
✅ **Implemented**: When marks are modified, the audit log captures:
- Before values: Previous marks, grades, and status
- After values: New marks, grades, and status
- All mark components (theory, practical, internal)

### Requirement 14.5: Performance
✅ **Implemented**: Audit log queries are optimized with:
- Database indexes on userId, timestamp, resource, and action
- Pagination (20 records per page by default)
- Efficient query structure

## Implementation Details

### 1. Audit Log Creation

**File**: `src/lib/actions/marksEntryActions.ts`

The `saveExamMarks` function has been updated to:
- Fetch existing exam results before updating
- Use `logCreate` for new entries
- Use `logUpdate` for modifications with before/after values
- Capture all mark components and metadata

```typescript
// For new entries
await logCreate(userId, "ExamResult", result.id, {
  examId, studentId, theoryMarks, practicalMarks, 
  internalMarks, totalMarks, percentage, grade, isAbsent
});

// For updates
await logUpdate(userId, "ExamResult", result.id, {
  before: { /* previous values */ },
  after: { /* new values */ }
});
```

### 2. Audit Log Viewing Interface

**File**: `src/components/admin/marks-audit-log-viewer.tsx`

Features:
- Filter by exam, student ID, and date range
- Paginated results (20 per page)
- Detailed view of changes in a modal dialog
- Display of user information, IP address, and timestamp
- Color-coded action badges (CREATE, UPDATE, DELETE)

**Page**: `src/app/admin/assessment/marks-audit/page.tsx`

Accessible at: `/admin/assessment/marks-audit`

### 3. Last Modified Information

**File**: `src/components/admin/marks-entry-grid.tsx`

Features:
- New "Last Modified" column in the marks entry grid
- Displays timestamp in compact format (MMM dd, HH:mm)
- Tooltip with detailed information:
  - Action type (CREATE/UPDATE)
  - User name and email
  - Full timestamp
- History icon for visual indication

### 4. Navigation

- Added "Marks Audit" card to assessment dashboard
- Added "View Audit Logs" button to marks entry page
- Integrated into the assessment management workflow

## Database Schema

The existing `AuditLog` model is used:

```prisma
model AuditLog {
  id         String      @id @default(cuid())
  userId     String
  user       User        @relation(fields: [userId], references: [id])
  action     AuditAction
  resource   String      // "ExamResult"
  resourceId String?     // ExamResult ID
  changes    Json?       // Before/after values
  ipAddress  String?
  userAgent  String?
  timestamp  DateTime    @default(now())
  
  @@index([userId, timestamp])
  @@index([resource, resourceId])
  @@index([resource, timestamp])
  @@index([action, timestamp])
}
```

## API Functions

### `getMarksAuditLogs(filters)`
Retrieves audit logs with filtering and pagination.

**Parameters**:
- `examId`: Filter by exam
- `studentId`: Filter by student
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `limit`: Number of records per page (default: 50)
- `offset`: Pagination offset

**Returns**: Paginated list of audit logs with user information

### `getExamResultLastModified(examId, studentId)`
Retrieves the last modification information for a specific exam result.

**Parameters**:
- `examId`: Exam ID
- `studentId`: Student ID

**Returns**: Last modification timestamp, user, and action

## Testing

**File**: `src/lib/actions/__tests__/marksAuditLogging.test.ts`

Test coverage includes:
- ✅ Audit log creation for new marks entry
- ✅ Audit log creation for marks updates with before/after values
- ✅ IP address and user agent capture
- ✅ Absent student marks handling
- ✅ Tracking changes when student is marked absent

All tests pass successfully.

## User Workflows

### Viewing Audit Logs

1. Navigate to Assessment → Marks Audit
2. Apply filters (optional):
   - Select exam
   - Enter student ID
   - Set date range
3. Click "Search"
4. View results in table
5. Click "View Changes" to see detailed before/after values

### Viewing Last Modified Info

1. Navigate to Assessment → Marks Entry
2. Select exam, class, and section
3. Load students
4. View "Last Modified" column in the grid
5. Hover over timestamp to see detailed tooltip

## Security Considerations

- Audit logs capture IP address and user agent for security tracking
- Only authenticated users can access audit logs
- Audit logs are immutable (no delete functionality)
- User information is included for accountability

## Performance Optimizations

- Database indexes on frequently queried fields
- Pagination to limit result set size
- Efficient JSON path queries for filtering
- Lazy loading of last modified information

## Future Enhancements

Potential improvements:
- Export audit logs to CSV/Excel
- Advanced filtering (by user, action type)
- Audit log retention policies
- Real-time notifications for suspicious activities
- Bulk audit log analysis and reporting

## Conclusion

The audit logging implementation provides comprehensive tracking of all marks entry and modification activities, meeting all requirements for accountability, transparency, and compliance.
