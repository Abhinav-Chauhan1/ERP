# Advanced Filtering System Guide

## Overview

The Advanced Filtering System provides a comprehensive, reusable filtering solution for list views across the ERP application. It supports multiple filter types, filter presets, and combines filters with AND logic.

## Features

### 1. Multiple Filter Types
- **Select Filters**: Dropdown selection for categorical data
- **Text Filters**: Free-text search across multiple fields
- **Date Range Filters**: Calendar-based date range selection
- **Multi-Select Filters**: (Extensible for future use)

### 2. Filter Presets
- Save frequently used filter combinations
- Name and store presets in localStorage
- Quick load saved presets
- Delete unwanted presets

### 3. Clear All Functionality
- Single-click to reset all filters
- Visual indicator showing active filter count
- Separate clear button for quick access

### 4. Real-time Filtering
- Filters apply automatically as you change them
- Loading indicator during filter application
- Optimized with React transitions for smooth UX

## Implementation

### Core Components

#### 1. AdvancedFilters Component
Location: `src/components/shared/advanced-filters.tsx`

The main reusable component that renders the filter UI.

**Props:**
```typescript
interface AdvancedFiltersProps {
  filters: FilterConfig[];           // Filter configuration
  value: FilterValue;                 // Current filter values
  onChange: (filters: FilterValue) => void;  // Filter change handler
  onClear: () => void;                // Clear all filters handler
  presets?: FilterPreset[];           // Saved filter presets
  onSavePreset?: (name: string, filters: FilterValue) => void;
  onDeletePreset?: (id: string) => void;
  onLoadPreset?: (preset: FilterPreset) => void;
}
```

**Filter Configuration:**
```typescript
interface FilterConfig {
  id: string;                         // Unique filter identifier
  label: string;                      // Display label
  type: "select" | "text" | "date-range" | "multi-select";
  options?: { value: string; label: string }[];  // For select types
  placeholder?: string;               // Placeholder text
}
```

#### 2. useFilterPresets Hook
Location: `src/hooks/use-filter-presets.ts`

Custom hook for managing filter presets with localStorage persistence.

**Usage:**
```typescript
const { presets, savePreset, deletePreset, loadPreset } = useFilterPresets(
  "unique-storage-key"
);
```

### Implemented Filters

#### Students Filtering
Location: `src/app/admin/users/students/`

**Available Filters:**
- Class (dropdown)
- Section (dropdown)
- Gender (dropdown)
- Enrollment Status (dropdown)
- Admission Date Range (calendar)
- Search (text - searches name, admission ID, roll number)

**Server Action:** `src/lib/actions/students-filters.ts`
- `getFilteredStudents(filters)` - Fetches filtered students
- `getFilterOptions()` - Fetches available classes and sections

#### Teachers Filtering
Location: `src/app/admin/users/teachers/`

**Available Filters:**
- Subject (dropdown)
- Department (dropdown)
- Employment Status (dropdown)
- Joining Date Range (calendar)
- Search (text - searches name, employee ID, department)

**Server Action:** `src/lib/actions/teachers-filters.ts`
- `getFilteredTeachers(filters)` - Fetches filtered teachers
- `getTeacherFilterOptions()` - Fetches available subjects and departments

#### Parents Filtering
Location: `src/app/admin/users/parents/`

**Available Filters:**
- Occupation (dropdown)
- Has Children (dropdown)
- Search (text - searches name, email, occupation)

**Server Action:** `src/lib/actions/parents-filters.ts`
- `getFilteredParents(filters)` - Fetches filtered parents
- `getParentFilterOptions()` - Fetches available occupations

## Usage Example

### Adding Filters to a New List Page

1. **Create Filter Action** (`src/lib/actions/your-entity-filters.ts`):

```typescript
"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface YourEntityFilters {
  field1?: string;
  field2?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export async function getFilteredEntities(filters: YourEntityFilters) {
  try {
    const where: Prisma.YourEntityWhereInput = {};

    // Add filter logic
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        // Add more searchable fields
      ];
    }

    if (filters.field1 && filters.field1 !== "all") {
      where.field1 = filters.field1;
    }

    const entities = await db.yourEntity.findMany({
      where,
      include: {
        // Include related data
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, entities };
  } catch (error) {
    console.error("Error fetching filtered entities:", error);
    return { success: false, error: "Failed to fetch entities", entities: [] };
  }
}

export async function getFilterOptions() {
  // Fetch filter options from database
  return { success: true, options: [] };
}
```

2. **Create Client Component** (`your-entity-with-filters.tsx`):

```typescript
"use client";

import { useState, useEffect, useTransition } from "react";
import { YourEntityTable } from "@/components/your-entity-table";
import { AdvancedFilters, FilterConfig, FilterValue } from "@/components/shared/advanced-filters";
import { useFilterPresets } from "@/hooks/use-filter-presets";
import { getFilteredEntities } from "@/lib/actions/your-entity-filters";
import { Loader2 } from "lucide-react";

export function YourEntityWithFilters({ initialEntities, filterOptions }) {
  const [entities, setEntities] = useState(initialEntities);
  const [filters, setFilters] = useState<FilterValue>({});
  const [isPending, startTransition] = useTransition();

  const { presets, savePreset, deletePreset, loadPreset } = useFilterPresets(
    "your-entity-filter-presets"
  );

  const filterConfigs: FilterConfig[] = [
    {
      id: "field1",
      label: "Field 1",
      type: "select",
      placeholder: "All",
      options: [
        { value: "all", label: "All" },
        // Add options
      ],
    },
    {
      id: "search",
      label: "Search",
      type: "text",
      placeholder: "Search...",
    },
  ];

  useEffect(() => {
    const applyFilters = async () => {
      startTransition(async () => {
        const result = await getFilteredEntities({
          field1: filters.field1 as string,
          search: filters.search as string,
        });

        if (result.success) {
          setEntities(result.entities);
        }
      });
    };

    applyFilters();
  }, [filters]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <AdvancedFilters
          filters={filterConfigs}
          value={filters}
          onChange={setFilters}
          onClear={() => setFilters({})}
          presets={presets}
          onSavePreset={savePreset}
          onDeletePreset={deletePreset}
          onLoadPreset={(preset) => setFilters(loadPreset(preset))}
        />
        {isPending && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Applying filters...
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {entities.length} result{entities.length !== 1 ? "s" : ""}
      </div>

      <YourEntityTable entities={entities} />
    </div>
  );
}
```

3. **Update Page Component**:

```typescript
import { YourEntityWithFilters } from "./your-entity-with-filters";
import { getFilterOptions } from "@/lib/actions/your-entity-filters";

export default async function YourEntityPage() {
  const [entities, filterOptions] = await Promise.all([
    db.yourEntity.findMany({ /* ... */ }),
    getFilterOptions(),
  ]);

  return (
    <Card>
      <CardContent>
        <YourEntityWithFilters
          initialEntities={entities}
          filterOptions={filterOptions}
        />
      </CardContent>
    </Card>
  );
}
```

## Filter Logic

### AND Logic
All filters are combined with AND logic. For example:
- Class = "Grade 10" AND Gender = "MALE" AND Status = "ACTIVE"

This means a student must match ALL selected filters to appear in results.

### Search Logic
Search uses OR logic across multiple fields:
- Name contains "John" OR Admission ID contains "John" OR Roll Number contains "John"

### Date Range Logic
Date ranges are inclusive:
- admissionDate >= startDate AND admissionDate <= endDate

## Performance Considerations

1. **Server-Side Filtering**: All filtering happens on the server using Prisma queries
2. **Indexed Fields**: Ensure frequently filtered fields have database indexes
3. **Debouncing**: Text search could be debounced for better performance (future enhancement)
4. **Pagination**: Consider adding pagination for large result sets (future enhancement)

## Accessibility

- Keyboard navigation supported
- ARIA labels on all interactive elements
- Focus indicators visible
- Screen reader compatible

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- localStorage required for preset functionality
- Graceful degradation if localStorage unavailable

## Future Enhancements

1. **Multi-Select Filters**: Support selecting multiple values for a single filter
2. **Advanced Search**: Boolean operators (AND, OR, NOT)
3. **Filter History**: Track and restore previous filter states
4. **Export Filtered Data**: Export only filtered results
5. **URL State**: Persist filters in URL for sharing
6. **Saved Views**: Server-side saved filter combinations
7. **Filter Analytics**: Track most used filters

## Requirements Validation

This implementation satisfies all requirements from Requirement 24:

✅ **24.1**: Filters for class, section, gender, and enrollment status implemented for students
✅ **24.2**: Multiple filters combined with AND logic
✅ **24.3**: Save filter presets functionality with localStorage persistence
✅ **24.4**: Clear all filters button prominently displayed
✅ **24.5**: Date range selection with calendar picker for admission dates

## Testing

To test the filtering system:

1. Navigate to Admin > Users > Students
2. Click the "Filters" button
3. Select various filter combinations
4. Verify results update correctly
5. Save a filter preset
6. Clear filters and reload the preset
7. Test date range filtering
8. Test text search across multiple fields

## Troubleshooting

**Filters not applying:**
- Check browser console for errors
- Verify server actions are properly exported
- Ensure database fields match filter field names

**Presets not saving:**
- Check localStorage is enabled in browser
- Verify storage key is unique per entity type
- Check browser storage limits

**Performance issues:**
- Add database indexes on filtered fields
- Consider implementing pagination
- Optimize Prisma queries with proper includes

## Support

For issues or questions about the filtering system, refer to:
- This documentation
- Component source code with inline comments
- ERP system requirements document
