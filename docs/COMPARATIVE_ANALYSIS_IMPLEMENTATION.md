# Comparative Analysis Implementation

## Overview

The Comparative Analysis feature enables administrators to compare performance metrics across different time periods, supporting both year-over-year and term-over-term comparisons. This implementation fulfills **Requirement 10.5** from the ERP production completion specification.

## Features Implemented

### 1. Year-over-Year Comparison
- Compare metrics across different academic years
- Automatic detection of previous year if not specified
- Visual trend analysis with charts and tables

### 2. Term-over-Term Comparison
- Compare metrics across different terms
- Support for comparing terms within the same year or across years
- Automatic detection of previous term

### 3. Data Sources Supported
- **Attendance**: Track attendance rate changes over time
- **Fee Payments**: Analyze payment trends and collection rates
- **Exam Results**: Compare academic performance across periods
- **Student Enrollment**: Monitor enrollment trends

### 4. Metrics and Aggregations
- **Metrics**: Attendance rate, payment amounts, exam marks, percentages, counts
- **Aggregations**: Sum, Average, Count
- Flexible configuration based on data source

### 5. Visualizations
- **Summary Cards**: Display current period, previous period, and change metrics
- **Line Chart**: Show monthly trends for both periods
- **Bar Chart**: Side-by-side comparison of values
- **Data Table**: Detailed month-by-month breakdown with percentage changes

## Technical Implementation

### Server Actions

**File**: `src/lib/actions/reportBuilderActions.ts`

#### New Interfaces

```typescript
export interface ComparativeAnalysisConfig {
  comparisonType: "year-over-year" | "term-over-term";
  dataSource: string;
  metric: string;
  aggregation: "sum" | "average" | "count";
  currentPeriodId: string;
  previousPeriodId?: string;
  filters?: ReportFilter[];
}

export interface ComparisonResult {
  currentPeriod: {
    id: string;
    name: string;
    value: number;
    data: any[];
  };
  previousPeriod: {
    id: string;
    name: string;
    value: number;
    data: any[];
  };
  change: {
    absolute: number;
    percentage: number;
    trend: "up" | "down" | "stable";
  };
  chartData: Array<{
    period: string;
    current: number;
    previous: number;
  }>;
}
```

#### Key Functions

1. **`generateYearOverYearComparison(config)`**
   - Generates comparison between academic years
   - Auto-detects previous year if not specified
   - Returns aggregated metrics and chart data

2. **`generateTermOverTermComparison(config)`**
   - Generates comparison between terms
   - Handles cross-year term comparisons
   - Returns detailed comparison results

3. **`fetchPeriodData(dataSource, metric, startDate, endDate, filters)`**
   - Fetches data for a specific time period
   - Supports multiple data sources
   - Applies filters as needed

4. **`aggregateData(data, metric, aggregation)`**
   - Aggregates data based on metric and aggregation type
   - Handles different data structures
   - Returns calculated value

5. **`prepareComparisonChartData(currentData, previousData, metric, currentLabel, previousLabel)`**
   - Prepares data for chart visualization
   - Groups data by month
   - Returns formatted chart data

6. **`getAvailableAcademicYears()`**
   - Retrieves all academic years for selection
   - Orders by most recent first

7. **`getAvailableTerms(academicYearId?)`**
   - Retrieves terms for selection
   - Optionally filters by academic year

### React Component

**File**: `src/components/admin/reports/comparative-analysis.tsx`

#### Features
- Interactive form for configuring comparisons
- Dynamic metric selection based on data source
- Real-time chart updates
- Responsive design for mobile and desktop
- Loading states and error handling

#### UI Components Used
- Cards for layout and organization
- Select dropdowns for configuration
- Recharts for data visualization (Line and Bar charts)
- Toast notifications for user feedback

### Page Component

**File**: `src/app/admin/reports/comparative/page.tsx`

- Server-side rendered page
- Suspense boundary for loading states
- Metadata for SEO

## Usage

### Accessing the Feature

1. Navigate to **Admin Dashboard** → **Reports & Analytics**
2. Click on **Comparative Analysis** in the Quick Actions section
3. Or directly visit `/admin/reports/comparative`

### Generating a Comparison

1. **Select Comparison Type**
   - Year-over-Year: Compare across academic years
   - Term-over-Term: Compare across terms

2. **Choose Data Source**
   - Attendance, Fee Payments, Exam Results, or Student Enrollment

3. **Select Metric**
   - Options vary based on data source
   - Examples: Attendance Rate, Payment Amount, Exam Marks

4. **Choose Aggregation**
   - Average, Sum, or Count

5. **Select Periods**
   - Current Period: The period you want to analyze
   - Previous Period: Leave as "Auto-detect" or manually select

6. **Click "Generate Comparison"**

### Interpreting Results

#### Summary Cards
- **Current Period**: Shows the value for the selected current period
- **Previous Period**: Shows the value for the comparison period
- **Change**: Displays absolute change, percentage change, and trend indicator
  - 🔼 Green: Upward trend (improvement)
  - 🔽 Red: Downward trend (decline)
  - ➖ Gray: Stable (minimal change)

#### Charts
- **Line Chart**: Shows monthly trends over time for both periods
- **Bar Chart**: Provides side-by-side comparison for easy visual comparison

#### Data Table
- Month-by-month breakdown
- Shows values for both periods
- Calculates difference and percentage change
- Color-coded for quick identification of trends

## Testing

### Unit Tests

**File**: `src/lib/actions/comparativeAnalysis.test.ts`

Tests cover:
- Year-over-year comparison generation
- Term-over-term comparison generation
- Error handling for invalid periods
- Data aggregation calculations
- Trend identification logic
- Percentage change calculations

Run tests:
```bash
npm test src/lib/actions/comparativeAnalysis.test.ts
```

### Test Results
✅ All 12 tests passing
- Year-over-Year Comparison (2 tests)
- Term-over-Term Comparison (2 tests)
- Data Aggregation (2 tests)
- Trend Calculation (3 tests)
- Percentage Change Calculation (3 tests)

## Example Use Cases

### 1. Attendance Trend Analysis
Compare attendance rates between current and previous academic year to identify if attendance is improving or declining.

**Configuration**:
- Comparison Type: Year-over-Year
- Data Source: Attendance
- Metric: Attendance Rate
- Aggregation: Average

### 2. Fee Collection Performance
Analyze fee collection trends across terms to optimize collection strategies.

**Configuration**:
- Comparison Type: Term-over-Term
- Data Source: Fee Payments
- Metric: Payment Amount
- Aggregation: Sum

### 3. Academic Performance Tracking
Monitor exam performance improvements or declines across academic years.

**Configuration**:
- Comparison Type: Year-over-Year
- Data Source: Exam Results
- Metric: Percentage
- Aggregation: Average

### 4. Enrollment Growth Analysis
Track student enrollment trends to plan for capacity and resources.

**Configuration**:
- Comparison Type: Year-over-Year
- Data Source: Student Enrollment
- Metric: Count
- Aggregation: Count

## Data Flow

```
User Input (UI)
    ↓
ComparativeAnalysisConfig
    ↓
generateYearOverYearComparison() or generateTermOverTermComparison()
    ↓
Fetch Current Period Data ← fetchPeriodData()
    ↓
Fetch Previous Period Data ← fetchPeriodData()
    ↓
Aggregate Data ← aggregateData()
    ↓
Calculate Changes (absolute, percentage, trend)
    ↓
Prepare Chart Data ← prepareComparisonChartData()
    ↓
ComparisonResult
    ↓
Display in UI (Charts, Tables, Cards)
```

## Database Queries

The feature uses the following Prisma queries:

### Academic Years
```typescript
prisma.academicYear.findUnique({ where: { id } })
prisma.academicYear.findFirst({ where: { endDate: { lt: date } } })
prisma.academicYear.findMany({ orderBy: { startDate: "desc" } })
```

### Terms
```typescript
prisma.term.findUnique({ where: { id }, include: { academicYear: true } })
prisma.term.findFirst({ where: { academicYearId, endDate: { lt: date } } })
prisma.term.findMany({ where, orderBy: { startDate: "desc" } })
```

### Data Fetching (with date filters)
```typescript
prisma.studentAttendance.findMany({ where: { date: { gte, lte } } })
prisma.feePayment.findMany({ where: { paymentDate: { gte, lte } } })
prisma.examResult.findMany({ where: { createdAt: { gte, lte } } })
prisma.student.findMany({ where: { admissionDate: { gte, lte } } })
```

## Performance Considerations

1. **Data Limiting**: Queries are limited to 1000 records for performance
2. **Indexed Fields**: Uses indexed date fields for efficient filtering
3. **Aggregation**: Performed in application layer for flexibility
4. **Caching**: Results can be cached for frequently accessed comparisons

## Future Enhancements

Potential improvements for future iterations:

1. **Export Functionality**: Add PDF/Excel export for comparison reports
2. **Custom Date Ranges**: Allow custom date range selection beyond predefined periods
3. **Multiple Metrics**: Compare multiple metrics simultaneously
4. **Drill-Down**: Click on chart data points to see detailed records
5. **Saved Comparisons**: Save frequently used comparison configurations
6. **Scheduled Comparisons**: Automatically generate and email comparisons
7. **More Data Sources**: Add support for library, transport, and other modules
8. **Advanced Filters**: Add class, section, and other dimension filters
9. **Forecasting**: Add trend-based forecasting for future periods
10. **Benchmarking**: Compare against industry standards or other schools

## Requirements Validation

✅ **Requirement 10.5**: WHEN comparing data THEN the ERP System SHALL support year-over-year and term-over-term comparative analysis

This implementation fully satisfies the requirement by:
- Supporting year-over-year comparisons across academic years
- Supporting term-over-term comparisons across terms
- Providing visual charts for comparison
- Displaying detailed comparison tables
- Calculating change metrics (absolute, percentage, trend)
- Auto-detecting previous periods when not specified
- Supporting multiple data sources and metrics

## Files Modified/Created

### Created Files
1. `src/components/admin/reports/comparative-analysis.tsx` - Main UI component
2. `src/app/admin/reports/comparative/page.tsx` - Page component
3. `src/lib/actions/comparativeAnalysis.test.ts` - Unit tests
4. `docs/COMPARATIVE_ANALYSIS_IMPLEMENTATION.md` - This documentation

### Modified Files
1. `src/lib/actions/reportBuilderActions.ts` - Added comparative analysis functions
2. `src/app/admin/reports/page.tsx` - Added navigation link

## Conclusion

The Comparative Analysis feature provides administrators with powerful tools to analyze trends and make data-driven decisions. The implementation is flexible, performant, and user-friendly, with comprehensive test coverage and clear documentation.
