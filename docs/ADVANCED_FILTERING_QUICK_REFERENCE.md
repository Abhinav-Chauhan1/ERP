# Advanced Filtering System - Quick Reference

## Quick Start

### For Users

#### Applying Filters
1. Navigate to any list page (Students, Teachers, or Parents)
2. Click the **"Filters"** button
3. Select your desired filter options
4. Filters apply automatically
5. See the result count update in real-time

#### Saving Filter Presets
1. Apply your desired filters
2. Click **"Save Preset"** button in the filter dropdown
3. Enter a name for your preset (e.g., "Active Grade 10 Students")
4. Click **"Save Preset"**
5. Your preset is now saved and appears in the "Saved Presets" section

#### Loading Saved Presets
1. Click the **"Filters"** button
2. Scroll to the "Saved Presets" section
3. Click on any preset name to load it
4. Filters apply automatically

#### Clearing Filters
**Option 1:** Click the **"Clear All"** button inside the filter dropdown
**Option 2:** Click the **"Clear Filters"** button next to the Filters button (appears when filters are active)

### For Developers

#### Adding Filters to a New Entity

**Step 1:** Create filter action file
```typescript
// src/lib/actions/your-entity-filters.ts
"use server";

export async function getFilteredEntities(filters: YourFilters) {
  const where: Prisma.YourEntityWhereInput = {};
  // Add filter logic
  return { success: true, entities: [] };
}
```

**Step 2:** Create client component
```typescript
// your-entity-with-filters.tsx
"use client";

export function YourEntityWithFilters({ initialData }) {
  const [filters, setFilters] = useState<FilterValue>({});
  const { presets, savePreset, deletePreset, loadPreset } = 
    useFilterPresets("your-entity-presets");
  
  return (
    <AdvancedFilters
      filters={filterConfigs}
      value={filters}
      onChange={setFilters}
      onClear={() => setFilters({})}
      presets={presets}
      onSavePreset={savePreset}
      onDeletePreset={deletePreset}
      onLoadPreset={(p) => setFilters(loadPreset(p))}
    />
  );
}
```

**Step 3:** Update page component
```typescript
// page.tsx
export default async function Page() {
  const data = await db.yourEntity.findMany();
  return <YourEntityWithFilters initialData={data} />;
}
```

## Available Filters by Entity

### Students
| Filter | Type | Options |
|--------|------|---------|
| Class | Select | All available classes |
| Section | Select | All available sections |
| Gender | Select | Male, Female, Other |
| Enrollment Status | Select | Active, Inactive, Transferred |
| Admission Date | Date Range | Calendar picker |
| Search | Text | Name, Admission ID, Roll Number |

### Teachers
| Filter | Type | Options |
|--------|------|---------|
| Subject | Select | All available subjects |
| Department | Select | All departments |
| Employment Status | Select | Full Time, Part Time, Contract |
| Joining Date | Date Range | Calendar picker |
| Search | Text | Name, Employee ID, Department |

### Parents
| Filter | Type | Options |
|--------|------|---------|
| Occupation | Select | All occupations |
| Has Children | Select | Yes, No |
| Search | Text | Name, Email, Occupation |

## Filter Types

### Select Filter
- Dropdown with predefined options
- Single selection
- "All" option to clear filter

### Text Filter
- Free text input
- Searches across multiple fields
- Case-insensitive
- Partial matching

### Date Range Filter
- Calendar-based selection
- Dual month view
- Inclusive range (from date to to date)
- Clear and Apply buttons

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate between filter fields |
| `Enter` | Apply date range / Submit |
| `Escape` | Close filter dropdown |
| `Arrow Keys` | Navigate dropdown options |

## Common Use Cases

### Example 1: Find Active Male Students in Grade 10
1. Click "Filters"
2. Select Class: "Grade 10"
3. Select Gender: "Male"
4. Select Enrollment Status: "Active"
5. Results update automatically

### Example 2: Find Teachers Who Joined This Year
1. Click "Filters"
2. Click "Joining Date Range"
3. Select January 1, 2025 as start date
4. Select today as end date
5. Click "Apply"

### Example 3: Search for a Specific Student
1. Click "Filters"
2. Type student name in "Search" field
3. Results filter as you type

### Example 4: Save Frequently Used Filter
1. Apply your filters (e.g., Active Grade 10 Students)
2. Click "Save Preset"
3. Name it "Active Grade 10"
4. Click "Save Preset"
5. Next time, just load this preset!

## Visual Indicators

### Active Filter Count Badge
- Appears on the "Filters" button
- Shows number of active filters
- Example: "Filters (3)" means 3 filters are active

### Loading Indicator
- Appears while filters are being applied
- Shows "Applying filters..." with spinner
- Indicates server is processing request

### Result Count
- Shows below filters
- Updates in real-time
- Example: "Showing 45 students"

## Tips & Tricks

### Tip 1: Combine Multiple Filters
All filters work together (AND logic). The more filters you add, the more specific your results become.

### Tip 2: Use Presets for Common Queries
Save time by creating presets for filters you use frequently.

### Tip 3: Clear Individual Filters
To remove one filter, just change it back to "All" or clear the text field.

### Tip 4: Date Range Shortcuts
- Click a date once to set start date
- Click another date to set end date
- Click "Clear" to remove date filter

### Tip 5: Search is Powerful
The search field looks across multiple fields, so you can search by name, ID, or other identifiers.

## Troubleshooting

### Filters Not Working?
1. Check if you have an active internet connection
2. Refresh the page
3. Clear all filters and try again
4. Check browser console for errors

### Presets Not Saving?
1. Ensure localStorage is enabled in your browser
2. Check if you're in private/incognito mode
3. Try a different browser

### No Results Found?
1. Your filter combination might be too restrictive
2. Try removing some filters
3. Use "Clear All" to reset

### Slow Performance?
1. Reduce the number of active filters
2. Be more specific with text search
3. Contact administrator if issue persists

## API Reference

### FilterConfig Interface
```typescript
interface FilterConfig {
  id: string;              // Unique identifier
  label: string;           // Display label
  type: "select" | "text" | "date-range";
  options?: Array<{        // For select type
    value: string;
    label: string;
  }>;
  placeholder?: string;    // Placeholder text
}
```

### FilterValue Type
```typescript
type FilterValue = {
  [key: string]: string | string[] | DateRange | undefined;
}
```

### FilterPreset Interface
```typescript
interface FilterPreset {
  id: string;              // Unique preset ID
  name: string;            // User-defined name
  filters: FilterValue;    // Saved filter values
}
```

## Support

For detailed documentation, see:
- **ADVANCED_FILTERING_GUIDE.md** - Complete implementation guide
- **ADVANCED_FILTERING_IMPLEMENTATION_SUMMARY.md** - Technical details

For issues or questions:
1. Check this quick reference
2. Review the full documentation
3. Contact the development team
