# Scheduled Reports Guide

## Overview

The Scheduled Reports feature allows administrators to automate report generation and delivery. Reports are automatically generated at specified intervals and emailed to configured recipients.

## Features

- **Automated Report Generation**: Schedule reports to run daily, weekly, or monthly
- **Multiple Data Sources**: Generate reports from students, teachers, attendance, fees, exams, classes, and assignments
- **Flexible Scheduling**: Configure specific times and days for report generation
- **Email Delivery**: Automatically email reports to multiple recipients
- **Multiple Export Formats**: Support for PDF, Excel, and CSV formats
- **Active/Inactive Status**: Easily pause and resume scheduled reports

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Resend API Key for email delivery
RESEND_API_KEY=your_resend_api_key_here

# Email sender address (optional, defaults to noreply@schoolerp.com)
EMAIL_FROM=School ERP <noreply@yourschool.com>
```

### Getting a Resend API Key

1. Sign up for a free account at [resend.com](https://resend.com)
2. Verify your domain (or use the test domain for development)
3. Generate an API key from the dashboard
4. Add the API key to your `.env` file

## Usage

### Creating a Scheduled Report

1. Navigate to **Admin > Reports > Scheduled Reports**
2. Click **New Scheduled Report**
3. Fill in the form:
   - **Basic Information**: Name and description
   - **Data Configuration**: Select data source and fields to include
   - **Schedule Configuration**: Set frequency, time, and day
   - **Recipients**: Add email addresses
   - **Export Format**: Choose PDF, Excel, or CSV
4. Click **Create Report**

### Managing Scheduled Reports

- **View All Reports**: See all scheduled reports with their status and next run time
- **Edit Report**: Click the edit icon to modify configuration
- **Pause/Resume**: Click the pause/play icon to toggle active status
- **Delete Report**: Click the delete icon to remove a scheduled report

### Schedule Options

#### Daily Reports
- Runs every day at the specified time
- Example: Daily attendance report at 9:00 AM

#### Weekly Reports
- Runs once per week on the specified day
- Example: Weekly performance report every Monday at 8:00 AM

#### Monthly Reports
- Runs once per month on the specified day
- Example: Monthly fee collection report on the 1st at 9:00 AM

## Data Sources

### Students
Available fields: name, email, class, section, rollNumber, dateOfBirth, gender, phone

### Teachers
Available fields: name, email, employeeId, qualification, joinDate, subjects

### Attendance
Available fields: studentName, date, status, class, section, remarks

### Fee Payments
Available fields: studentName, amount, paymentDate, status, method, class

### Exam Results
Available fields: studentName, examName, subject, marks, totalMarks, percentage, grade

### Classes
Available fields: name, section, grade, capacity, teacher, studentCount

### Assignments
Available fields: title, subject, class, dueDate, status, submissionCount, teacher

## Technical Details

### How It Works

1. **Cron Job**: A cron job runs every minute to check for due reports
2. **Report Generation**: When a report is due, the system:
   - Fetches data based on the configuration
   - Generates the file in the specified format
   - Creates an email with the report attached
   - Sends the email to all recipients
3. **Next Run Calculation**: After execution, the system calculates the next run time

### Service Initialization

The scheduled report service is automatically initialized when the Next.js server starts via the `instrumentation.ts` file.

### Database Schema

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
}
```

## Troubleshooting

### Reports Not Being Sent

1. **Check Email Configuration**: Ensure `RESEND_API_KEY` is set correctly
2. **Verify Active Status**: Make sure the report is active
3. **Check Next Run Time**: Verify the next run time is in the future
4. **Review Server Logs**: Check for any error messages in the console

### Email Delivery Issues

1. **Verify API Key**: Ensure your Resend API key is valid
2. **Check Domain Verification**: Verify your sending domain in Resend
3. **Review Recipient Emails**: Ensure all recipient email addresses are valid
4. **Check Spam Folders**: Reports might be filtered as spam

### Report Generation Errors

1. **Check Data Source**: Ensure the data source has data
2. **Verify Field Selection**: Make sure selected fields are valid
3. **Review Database Connection**: Ensure the database is accessible

## Best Practices

1. **Test First**: Create a test report with your own email before adding multiple recipients
2. **Use Descriptive Names**: Give reports clear, descriptive names
3. **Limit Recipients**: Avoid adding too many recipients to prevent email issues
4. **Monitor Execution**: Regularly check the last run time to ensure reports are executing
5. **Pause Unused Reports**: Deactivate reports that are no longer needed instead of deleting them

## API Reference

### Server Actions

#### `createScheduledReport(input: ScheduledReportInput)`
Creates a new scheduled report.

#### `getScheduledReports()`
Retrieves all scheduled reports.

#### `getScheduledReport(id: string)`
Retrieves a single scheduled report by ID.

#### `updateScheduledReport(id: string, input: ScheduledReportInput)`
Updates an existing scheduled report.

#### `deleteScheduledReport(id: string)`
Deletes a scheduled report.

#### `toggleScheduledReportStatus(id: string, active: boolean)`
Toggles the active status of a scheduled report.

## Requirements

This feature implements **Requirement 10.3** from the ERP Production Completion specification:

> WHEN an administrator schedules a report THEN the ERP System SHALL automatically generate and email reports at specified intervals

## Support

For issues or questions about scheduled reports, please contact your system administrator or refer to the main ERP documentation.
