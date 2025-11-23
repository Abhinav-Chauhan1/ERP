# Scheduled Reports Implementation Summary

## Overview

This document summarizes the implementation of the Scheduled Reports feature for the School ERP system, which fulfills **Requirement 10.3** from the ERP Production Completion specification.

## Requirement

**Requirement 10.3**: WHEN an administrator schedules a report THEN the ERP System SHALL automatically generate and email reports at specified intervals

## Implementation Details

### 1. Database Schema

Added `ScheduledReport` model to Prisma schema:

```prisma
model ScheduledReport {
  id              String    @id @default(cuid())
  name            String
  description     String?
  dataSource      String
  selectedFields  String    // JSON array
  filters         String    // JSON array
  sorting         String    // JSON array
  frequency       String    // daily, weekly, monthly
  scheduleTime    String    // HH:mm format
  dayOfWeek       Int?      // 0-6 for weekly
  dayOfMonth      Int?      // 1-31 for monthly
  recipients      String    // JSON array of emails
  exportFormat    String    // pdf, excel, csv
  active          Boolean   @default(true)
  lastRunAt       DateTime?
  nextRunAt       DateTime?
  createdBy       String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([active, nextRunAt])
  @@index([createdBy])
  @@map("scheduled_reports")
}
```

### 2. Server Actions

Created `src/lib/actions/scheduledReportActions.ts` with the following functions:

- `createScheduledReport(input)` - Create a new scheduled report
- `getScheduledReports()` - Retrieve all scheduled reports
- `getScheduledReport(id)` - Retrieve a single scheduled report
- `updateScheduledReport(id, input)` - Update an existing scheduled report
- `deleteScheduledReport(id)` - Delete a scheduled report
- `toggleScheduledReportStatus(id, active)` - Toggle active/inactive status
- `updateScheduledReportRunTime(id)` - Update last run and calculate next run time

### 3. Email Service

Created `src/lib/utils/email-service.ts` with:

- `sendEmail(options)` - Send emails using Resend API
- `generateReportEmailTemplate(name, description, date)` - Generate HTML email template

### 4. Scheduled Report Service

Created `src/lib/services/scheduled-report-service.ts` with:

- `initializeScheduledReportService()` - Initialize cron job (runs every minute)
- `checkScheduledReports()` - Check for due reports and execute them
- `executeScheduledReport(id)` - Generate and email a specific report
- `triggerScheduledReport(id)` - Manually trigger a report (for testing)

Report generation functions:
- `generatePDF(name, data)` - Generate PDF using jsPDF
- `generateExcel(name, data)` - Generate Excel using xlsx
- `generateCSV(data)` - Generate CSV

### 5. User Interface

Created the following pages and components:

**Pages:**
- `/admin/reports/scheduled` - List all scheduled reports
- `/admin/reports/scheduled/new` - Create new scheduled report
- `/admin/reports/scheduled/[id]/edit` - Edit existing scheduled report

**Components:**
- `ScheduledReportsList` - Display list of scheduled reports with actions
- `ScheduledReportForm` - Form for creating/editing scheduled reports

### 6. Service Initialization

Updated `src/instrumentation.ts` to automatically initialize the scheduled report service when the Next.js server starts.

### 7. Navigation

Updated `/admin/reports/page.tsx` to add a link to the Scheduled Reports page in the Quick Actions section.

## Features Implemented

✅ **Create Scheduled Reports**
- Configure report name and description
- Select data source (students, teachers, attendance, fees, exams, classes, assignments)
- Choose fields to include in the report
- Set schedule (daily, weekly, monthly)
- Specify time and day
- Add multiple email recipients
- Choose export format (PDF, Excel, CSV)

✅ **Manage Scheduled Reports**
- View all scheduled reports with status
- Edit existing reports
- Pause/resume reports
- Delete reports
- See last run time and next run time

✅ **Automated Execution**
- Cron job runs every minute to check for due reports
- Automatically generates reports at scheduled times
- Sends reports via email with attachments
- Updates last run time and calculates next run time

✅ **Email Delivery**
- Integration with Resend email service
- Professional HTML email template
- Report attached in selected format
- Support for multiple recipients

✅ **Multiple Export Formats**
- PDF with formatted tables
- Excel with metadata
- CSV for data analysis

## Configuration

### Environment Variables

```env
# Required
RESEND_API_KEY=your_resend_api_key

# Optional
EMAIL_FROM=School ERP <noreply@yourschool.com>
```

### Schedule Options

1. **Daily**: Runs every day at specified time
2. **Weekly**: Runs once per week on specified day (0=Sunday, 6=Saturday)
3. **Monthly**: Runs once per month on specified day (1-31)

## Testing

Created unit tests in `src/lib/actions/scheduledReportActions.test.ts`:

- ✅ Schedule time calculation logic
- ✅ Email validation
- ✅ Time format validation
- ✅ Frequency options
- ✅ Export format support

All tests pass successfully.

## Files Created/Modified

### New Files
1. `prisma/migrations/20251121110859_add_scheduled_reports/migration.sql`
2. `src/lib/actions/scheduledReportActions.ts`
3. `src/lib/utils/email-service.ts`
4. `src/lib/services/scheduled-report-service.ts`
5. `src/app/admin/reports/scheduled/page.tsx`
6. `src/app/admin/reports/scheduled/new/page.tsx`
7. `src/app/admin/reports/scheduled/[id]/edit/page.tsx`
8. `src/components/admin/reports/scheduled-reports-list.tsx`
9. `src/components/admin/reports/scheduled-report-form.tsx`
10. `src/lib/actions/scheduledReportActions.test.ts`
11. `docs/SCHEDULED_REPORTS_GUIDE.md`
12. `docs/SCHEDULED_REPORTS_IMPLEMENTATION.md`

### Modified Files
1. `prisma/schema.prisma` - Added ScheduledReport model
2. `src/instrumentation.ts` - Added scheduled report service initialization
3. `src/app/admin/reports/page.tsx` - Added navigation link

## Dependencies Used

- `node-cron` - Cron job scheduling (already installed)
- `resend` - Email service (already installed)
- `jspdf` & `jspdf-autotable` - PDF generation (already installed)
- `xlsx` - Excel generation (already installed)

## How It Works

1. **User Creates Schedule**: Admin configures a scheduled report through the UI
2. **Database Storage**: Configuration is stored in the `scheduled_reports` table
3. **Cron Job**: Service checks every minute for reports where `nextRunAt <= now` and `active = true`
4. **Report Generation**: When due, the system:
   - Fetches data based on configuration
   - Generates file in specified format (PDF/Excel/CSV)
   - Creates email with report attached
   - Sends to all recipients
5. **Next Run Calculation**: After execution, calculates and stores next run time
6. **Status Updates**: Updates `lastRunAt` and `nextRunAt` fields

## Usage Example

```typescript
// Create a daily attendance report
const result = await createScheduledReport({
  name: "Daily Attendance Report",
  description: "Student attendance summary",
  dataSource: "attendance",
  selectedFields: ["studentName", "date", "status", "class"],
  frequency: "daily",
  scheduleTime: "09:00",
  recipients: ["principal@school.com", "admin@school.com"],
  exportFormat: "pdf",
  filters: [],
  sorting: [],
});
```

## Security Considerations

- ✅ Authentication required for all actions (Clerk)
- ✅ Email validation before saving
- ✅ Server-side execution only
- ✅ Environment variable for API key
- ✅ Input validation with Zod schema

## Performance Considerations

- ✅ Cron job runs efficiently (checks database once per minute)
- ✅ Only active reports with due times are processed
- ✅ Database indexes on `active` and `nextRunAt` fields
- ✅ Report generation happens asynchronously
- ✅ Email sending is non-blocking

## Future Enhancements

Potential improvements for future iterations:

1. **Advanced Filtering**: Add support for custom filters in report configuration
2. **Report Templates**: Save and reuse report configurations
3. **Delivery Options**: Add support for SMS, Slack, or other delivery methods
4. **Report History**: Store generated reports for later access
5. **Retry Logic**: Implement retry mechanism for failed email deliveries
6. **Notification Preferences**: Allow recipients to manage their subscriptions
7. **Report Preview**: Preview report before scheduling
8. **Custom Formatting**: Allow customization of PDF/Excel styling

## Troubleshooting

### Common Issues

1. **Reports not sending**: Check RESEND_API_KEY is configured
2. **Wrong schedule time**: Ensure server timezone is correct
3. **Email not received**: Check spam folder, verify recipient emails
4. **Service not running**: Verify instrumentation.ts is being loaded

### Debugging

Enable debug logging by checking server console for:
- "Initializing scheduled report service..."
- "Found X due scheduled reports"
- "Executing scheduled report: {id}"
- "Successfully sent report {id} to X recipients"

## Compliance

This implementation fulfills:
- ✅ **Requirement 10.3**: Scheduled report delivery
- ✅ **Property 33**: Scheduled Report Delivery (from design document)

## Conclusion

The Scheduled Reports feature is fully implemented and ready for production use. It provides administrators with a powerful tool to automate report generation and delivery, saving time and ensuring stakeholders receive timely information.

The implementation follows best practices:
- Clean separation of concerns
- Type-safe with TypeScript
- Tested with unit tests
- Well-documented
- Secure and performant
- User-friendly interface

## Support

For detailed usage instructions, see `docs/SCHEDULED_REPORTS_GUIDE.md`.
