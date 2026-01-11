# Alumni Directory Components

This directory contains all components related to the Alumni Directory feature of the Student Promotion and Alumni Management system.

## Components

### AlumniDirectory
Main container component that orchestrates the entire alumni directory experience.

**Features:**
- Search and filter integration
- View toggle (card/table)
- Pagination controls
- Statistics dashboard tab
- Export functionality

**Requirements:** 6.1, 6.7

### AlumniSearchBar
Search input component with debounced search functionality.

**Features:**
- Real-time search with 300ms debounce
- Clear button
- Accessible search input

**Requirements:** 6.2

### AlumniFilters
Comprehensive filter panel with collapsible sections.

**Features:**
- Graduation year range filter
- Final class filter
- Current location filter
- Current occupation filter
- Higher education filter
- Active filter count badge
- Clear all filters button

**Requirements:** 6.3

### AlumniCard
Card view component for displaying alumni information.

**Features:**
- Profile photo with fallback initials
- Name and admission ID
- Graduation details (class, section, year)
- Current occupation and location
- Click handler for profile navigation

**Requirements:** 6.4

### AlumniTable
Table view component with sortable columns.

**Features:**
- Sortable columns (name, graduation date, class)
- Avatar display
- Badge for class/section
- Row click handler
- Responsive design

**Requirements:** 6.4, 6.5

### AlumniStats
Statistics dashboard with charts and summary cards.

**Features:**
- Summary cards (total alumni, occupations, cities, colleges)
- Graduation year distribution chart (bar chart)
- Top occupations chart (horizontal bar chart)
- Geographic distribution chart (pie chart)
- Top colleges chart (horizontal bar chart)

**Requirements:** 10.1, 10.2, 10.3, 10.4, 10.7

## Usage Example

```tsx
import { AlumniDirectory } from "@/components/admin/alumni";

export default function AlumniPage() {
  const handleSearch = async (searchTerm, filters, page, pageSize) => {
    // Fetch alumni data from server
    const result = await searchAlumni({
      searchTerm,
      ...filters,
      page,
      pageSize,
    });
    
    return {
      alumni: result.data.alumni,
      pagination: result.data.pagination,
    };
  };

  const handleExport = () => {
    // Export alumni directory
  };

  return (
    <AlumniDirectory
      initialAlumni={alumni}
      initialPagination={pagination}
      statistics={statistics}
      availableClasses={classes}
      availableCities={cities}
      availableOccupations={occupations}
      onSearch={handleSearch}
      onExport={handleExport}
    />
  );
}
```

## Data Types

### AlumniCardData
```typescript
interface AlumniCardData {
  id: string;
  studentName: string;
  admissionId: string;
  graduationDate: Date;
  finalClass: string;
  finalSection: string;
  currentOccupation?: string;
  currentCity?: string;
  currentEmail?: string;
  profilePhoto?: string;
}
```

### AlumniFiltersState
```typescript
interface AlumniFiltersState {
  graduationYearFrom?: number;
  graduationYearTo?: number;
  finalClass?: string;
  currentCity?: string;
  currentOccupation?: string;
  collegeName?: string;
}
```

### AlumniStatisticsData
```typescript
interface AlumniStatisticsData {
  totalAlumni: number;
  byGraduationYear: Record<number, number>;
  byOccupation: Record<string, number>;
  byCollege: Record<string, number>;
  byCity: Record<string, number>;
}
```

## Dependencies

- React 18+
- Next.js 14+
- shadcn/ui components
- Recharts for data visualization
- Lucide React for icons

## Accessibility

All components follow accessibility best practices:
- Semantic HTML
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Performance Considerations

- Search is debounced (300ms) to reduce API calls
- Pagination limits data fetching
- Lazy loading for charts
- Optimized re-renders with React.memo where appropriate
