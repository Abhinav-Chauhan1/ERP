# Skeleton Loader Components

This directory contains skeleton loader components that provide loading states for various UI patterns throughout the application. These components are designed to match the dimensions of actual content to prevent Cumulative Layout Shift (CLS) and improve perceived performance.

## Purpose

Skeleton loaders serve two main purposes:
1. **Improve User Experience**: Provide visual feedback during data loading
2. **Prevent Layout Shift**: Match dimensions of final content to maintain stable layouts (CLS < 0.1)

## Available Components

### Base Component

#### `Skeleton`
The base skeleton component from shadcn/ui.

```tsx
import { Skeleton } from "@/components/ui/skeleton";

<Skeleton className="h-4 w-48" />
```

### Specialized Components

#### `SkeletonTable`
For table-based list views with pagination.

```tsx
import { SkeletonTable } from "@/components/shared/loading/skeleton-table";

<SkeletonTable 
  rows={10} 
  columns={6} 
  showHeader={true}
  showPagination={true}
/>
```

**Props:**
- `rows?: number` - Number of skeleton rows (default: 5)
- `columns?: number` - Number of columns (default: 5)
- `showHeader?: boolean` - Show table header (default: true)
- `showPagination?: boolean` - Show pagination controls (default: true)

#### `SkeletonUserTable`
Specialized skeleton for user tables (students, teachers, parents) with avatars.

```tsx
import { SkeletonUserTable } from "@/components/shared/loading/skeleton-user-table";

<SkeletonUserTable 
  rows={10}
  showAvatar={true}
/>
```

**Props:**
- `rows?: number` - Number of skeleton rows (default: 10)
- `showAvatar?: boolean` - Show avatar circles (default: true)

#### `SkeletonCard`
For card-based content.

```tsx
import { SkeletonCard } from "@/components/shared/loading/skeleton-card";

<SkeletonCard 
  showHeader={true}
  showFooter={false}
  contentLines={3}
/>
```

**Props:**
- `showHeader?: boolean` - Show card header (default: true)
- `showFooter?: boolean` - Show card footer (default: false)
- `contentLines?: number` - Number of content lines (default: 3)

#### `SkeletonCardGrid`
Grid of skeleton cards.

```tsx
import { SkeletonCardGrid } from "@/components/shared/loading/skeleton-card";

<SkeletonCardGrid count={4} />
```

#### `SkeletonStats`
For statistics/metrics cards.

```tsx
import { SkeletonStats } from "@/components/shared/loading/skeleton-stats";

<SkeletonStats count={4} />
```

**Props:**
- `count?: number` - Number of stat cards (default: 4)

#### `SkeletonList`
For card-based list views.

```tsx
import { SkeletonList } from "@/components/shared/loading/skeleton-list";

<SkeletonList 
  items={6}
  showHeader={true}
  showActions={true}
/>
```

**Props:**
- `items?: number` - Number of list items (default: 6)
- `showHeader?: boolean` - Show list header (default: true)
- `showActions?: boolean` - Show action buttons (default: true)

#### `SkeletonGrid`
For grid-based layouts.

```tsx
import { SkeletonGrid } from "@/components/shared/loading/skeleton-list";

<SkeletonGrid 
  items={6}
  columns={3}
/>
```

**Props:**
- `items?: number` - Number of grid items (default: 6)
- `columns?: number` - Number of columns (default: 3)

## Usage in Next.js Pages

Create a `loading.tsx` file in your route directory:

```tsx
// app/admin/users/loading.tsx
import { SkeletonUserTable } from "@/components/shared/loading/skeleton-user-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table */}
      <SkeletonUserTable rows={10} />
    </div>
  );
}
```

## Best Practices

### 1. Match Dimensions
Ensure skeleton dimensions match the actual content:

```tsx
// ❌ Bad - dimensions don't match
<Skeleton className="h-4 w-full" />  // Actual content is h-8

// ✅ Good - dimensions match
<Skeleton className="h-8 w-48" />  // Matches actual heading
```

### 2. Maintain Layout Structure
Keep the same layout structure as the actual content:

```tsx
// ✅ Good - matches actual layout
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {Array.from({ length: 4 }).map((_, i) => (
    <SkeletonCard key={i} />
  ))}
</div>
```

### 3. Use Appropriate Components
Choose the right skeleton component for your use case:

- **Tables with rows** → `SkeletonTable` or `SkeletonUserTable`
- **Card grids** → `SkeletonCardGrid` or `SkeletonGrid`
- **Statistics** → `SkeletonStats`
- **Lists** → `SkeletonList`
- **Custom layouts** → Compose with base `Skeleton`

### 4. Include Interactive Elements
Don't forget to include skeletons for buttons, filters, and search:

```tsx
{/* Search and Filters */}
<div className="flex items-center gap-2">
  <Skeleton className="h-10 flex-1 max-w-md" />
  <Skeleton className="h-10 w-32" />
</div>
```

## Performance Considerations

1. **Prevent Layout Shift**: Skeleton dimensions should match final content to achieve CLS < 0.1
2. **Minimize Reflows**: Use fixed heights where possible
3. **Optimize Animations**: The pulse animation is GPU-accelerated via `animate-pulse`

## Testing

When adding new skeleton loaders:

1. Verify dimensions match actual content
2. Test on different screen sizes (mobile, tablet, desktop)
3. Measure CLS score using Chrome DevTools
4. Ensure smooth transition from skeleton to actual content

## Related Requirements

- **Requirement 17.1**: Skeleton loaders for all list pages
- **Property 53**: Skeleton Loader Dimension Matching
- **Property 55**: CLS Score Compliance (< 0.1)
