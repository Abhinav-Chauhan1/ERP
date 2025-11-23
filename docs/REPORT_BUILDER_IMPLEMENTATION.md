# Report Builder Implementation

## Overview

The Report Builder infrastructure has been implemented to allow administrators to create custom reports with drag-and-drop field selection, filters, and sorting capabilities.

## Features Implemented

### 1. Report Builder UI
- **Location**: `/admin/reports/builder`
- **Components**:
  - `ReportBuilderForm`: Main form for configuring reports
  - `ReportPreview`: Preview component showing report configuration and data
  - Report builder page with save and generate functionality

### 2. Data Sources
The following data sources are available:
- **Students**: Student information including enrollment, contact details
- **Teachers**: Teacher information including qualifications, subjects
- **Attendance**: Student attendance records
- **Fee Payments**: Fee payment history and status
- **Exam Results**: Exam scores and grades
- **Classes**: Class information and student counts
- **Assignments**: Assignment details and submission counts

### 3. Field Selection
- Drag-and-drop interface for selecting fields
- Click to toggle field selection
- Visual feedback for selected fields
- Dynamic field list based on selected data source

### 4. Filters
- Add multiple filters to reports
- Filter operators:
  - Equals
  - Not Equals
  - Contains
  - Greater Than
  - Less Than
  - Between
- Dynamic filter configuration per field

### 5. Sorting
- Add multiple sort criteria
- Sort directions: Ascending/Descending
- Sort by any selected field

## Technical Implementation

### Server Actions
**File**: `src/lib/actions/reportBuilderActions.ts`

Key functions:
- `generateReport(config)`: Generates report data based on configuration
- `saveReportConfig(config)`: Saves report configuration (placeholder for future database storage)
- Query functions for each data source (queryStudents, queryTeachers, etc.)

### Components

#### ReportBuilderForm
**File**: `src/components/admin/reports/report-builder-form.tsx`

Features:
- Data source selection dropdown
- Drag-and-drop field selection
- Dynamic filter management
- Dynamic sort management
- Real-time configuration updates

#### ReportPreview
**File**: `src/components/admin/reports/report-preview.tsx`

Features:
- Configuration summary display
- Applied filters display
- Applied sorting display
- Data table preview
- Sample data generation for preview

### Data Flow

1. User selects data source
2. Available fields are displayed
3. User drags/clicks fields to select them
4. User adds filters and sorting (optional)
5. User clicks "Generate Report"
6. Server action queries database based on configuration
7. Data is displayed in preview table
8. User can save configuration for future use

## Usage

### Creating a Report

1. Navigate to `/admin/reports`
2. Click "Custom Report Builder"
3. Enter a report name
4. Select a data source from the dropdown
5. Select fields by dragging or clicking
6. Add filters (optional):
   - Click "Add Filter"
   - Select field, operator, and value
7. Add sorting (optional):
   - Click "Add Sort"
   - Select field and direction
8. Click "Generate Report" to see results
9. Click "Save Report" to save configuration

### Example Report Configurations

#### Student List Report
- **Data Source**: Students
- **Fields**: name, email, class, section, rollNumber
- **Filter**: class equals "Grade 10"
- **Sort**: name ascending

#### Fee Collection Report
- **Data Source**: Fee Payments
- **Fields**: studentName, amount, paymentDate, status, class
- **Filter**: status equals "PAID"
- **Sort**: paymentDate descending

#### Attendance Summary Report
- **Data Source**: Attendance
- **Fields**: studentName, date, status, class, section
- **Filter**: date greaterThan "2024-01-01"
- **Sort**: date descending

## Testing

Unit tests are located in `src/lib/actions/reportBuilderActions.test.ts`

Run tests:
```bash
npm test src/lib/actions/reportBuilderActions.test.ts
```

Test coverage includes:
- Report configuration validation
- Filter configuration
- Sort configuration
- Data source validation
- Field selection logic

## Future Enhancements

1. **Export Functionality**: Add PDF, Excel, and CSV export (Task 36)
2. **Scheduled Reports**: Implement scheduled report generation (Task 37)
3. **Report Templates**: Save and reuse report configurations
4. **Advanced Visualizations**: Add charts and graphs to reports
5. **Report Sharing**: Share reports with other users
6. **Report History**: Track report generation history

## Requirements Validation

✅ **Requirement 10.1**: Create report builder UI with drag-and-drop field selection
- Implemented drag-and-drop interface
- Click-to-select alternative provided
- Visual feedback for selected fields

✅ Allow users to select data sources
- 7 data sources implemented
- Easy to extend with additional sources

✅ Allow users to select fields to include
- Dynamic field list per data source
- Multiple selection methods (drag/click)

✅ Allow users to add filters and sorting
- Multiple filters supported
- 6 filter operators available
- Multiple sort criteria supported
- Ascending/descending sort directions

## Architecture Notes

### Scalability
- Query functions are modular and easy to extend
- New data sources can be added by:
  1. Adding to DATA_SOURCES array in form component
  2. Adding query function in server actions
  3. Adding case in generateReport switch statement

### Performance
- Queries are limited to 1000 records for performance
- Pagination can be added in future enhancement
- Indexes on database ensure fast queries

### Security
- All queries use Clerk authentication
- Prisma ORM prevents SQL injection
- Server actions validate user permissions

## Related Files

- `/src/app/admin/reports/builder/page.tsx` - Main report builder page
- `/src/components/admin/reports/report-builder-form.tsx` - Form component
- `/src/components/admin/reports/report-preview.tsx` - Preview component
- `/src/lib/actions/reportBuilderActions.ts` - Server actions
- `/src/lib/actions/reportBuilderActions.test.ts` - Unit tests
