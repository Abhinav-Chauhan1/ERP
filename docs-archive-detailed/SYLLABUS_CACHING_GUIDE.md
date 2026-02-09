# Syllabus System Caching and Performance Guide

## Overview

The Enhanced Syllabus System implements a comprehensive caching strategy using both server-side and client-side caching to optimize performance and reduce database load.

## Architecture

### Two-Layer Caching Strategy

1. **Server-Side Caching** (Next.js unstable_cache)
   - Caches database queries on the server
   - Reduces database load
   - Shared across all users
   - Revalidates automatically based on time

2. **Client-Side Caching** (React Query)
   - Caches API responses in the browser
   - Reduces network requests
   - Per-user caching
   - Automatic background refetching

## Server-Side Caching

### Cache Tags

The system uses the following cache tags for syllabus-related data:

```typescript
CACHE_TAGS.SYLLABUS          // General syllabus data
CACHE_TAGS.MODULES           // Module data
CACHE_TAGS.SUB_MODULES       // Sub-module data
CACHE_TAGS.SYLLABUS_DOCUMENTS // Document data
CACHE_TAGS.SYLLABUS_PROGRESS  // Progress tracking data
```

### Cache Duration

- **Modules/SubModules**: 5 minutes (MEDIUM)
- **Progress**: 1 minute (SHORT)
- **Documents**: 5 minutes (MEDIUM)

### Cached Server Actions

Use these cached versions instead of direct database queries:

```typescript
import {
  getCachedModulesBySyllabus,
  getCachedSubModulesByModule,
  getPaginatedModules,
  getCachedModuleById,
  getCachedSyllabusProgress,
} from "@/lib/actions/cachedModuleActions";

// Fetch modules with caching
const result = await getCachedModulesBySyllabus(syllabusId);

// Fetch paginated modules
const paginatedResult = await getPaginatedModules(syllabusId, {
  page: 1,
  pageSize: 20,
});

// Fetch progress with caching
const progress = await getCachedSyllabusProgress(syllabusId, teacherId);
```

### Cache Invalidation

After mutations, caches are automatically invalidated:

```typescript
import {
  invalidateSyllabusCache,
  invalidateModuleCache,
  invalidateSubModuleCache,
  invalidateSyllabusProgressCache,
} from "@/lib/utils/cache-invalidation";

// Invalidate after creating/updating/deleting
await invalidateModuleCache(moduleId, syllabusId);
await invalidateSubModuleCache(subModuleId, moduleId);
await invalidateSyllabusProgressCache(teacherId);
```

## Client-Side Caching with React Query

### Setup

Wrap your application with the QueryProvider:

```tsx
// app/layout.tsx
import { QueryProvider } from "@/lib/contexts/QueryProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

### Using React Query Hooks

#### Fetching Data

```tsx
"use client";

import {
  useModulesBySyllabus,
  usePaginatedModules,
  useSubModulesByModule,
  useSyllabusProgress,
} from "@/hooks/use-syllabus-queries";

function SyllabusView({ syllabusId }: { syllabusId: string }) {
  // Fetch modules with automatic caching
  const { data: modules, isLoading, error } = useModulesBySyllabus(syllabusId);

  // Fetch paginated modules
  const { data: paginatedData } = usePaginatedModules(syllabusId, {
    page: 1,
    pageSize: 20,
  });

  // Fetch sub-modules for a specific module
  const { data: subModules } = useSubModulesByModule(moduleId);

  // Fetch progress
  const { data: progress } = useSyllabusProgress(syllabusId, teacherId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {modules?.map((module) => (
        <div key={module.id}>{module.title}</div>
      ))}
    </div>
  );
}
```

#### Mutations

```tsx
"use client";

import {
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useReorderModules,
} from "@/hooks/use-syllabus-queries";

function ModuleManager({ syllabusId }: { syllabusId: string }) {
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const reorderModules = useReorderModules();

  const handleCreate = async () => {
    try {
      await createModule.mutateAsync({
        title: "New Module",
        chapterNumber: 1,
        order: 1,
        syllabusId,
      });
      // Cache is automatically invalidated and refetched
    } catch (error) {
      console.error("Failed to create module:", error);
    }
  };

  const handleUpdate = async (moduleId: string) => {
    try {
      await updateModule.mutateAsync({
        id: moduleId,
        title: "Updated Module",
        chapterNumber: 1,
        order: 1,
        syllabusId,
      });
    } catch (error) {
      console.error("Failed to update module:", error);
    }
  };

  const handleDelete = async (moduleId: string) => {
    try {
      await deleteModule.mutateAsync({ id: moduleId, syllabusId });
    } catch (error) {
      console.error("Failed to delete module:", error);
    }
  };

  const handleReorder = async (moduleOrders: any[]) => {
    try {
      await reorderModules.mutateAsync({
        syllabusId,
        moduleOrders,
      });
    } catch (error) {
      console.error("Failed to reorder modules:", error);
    }
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={createModule.isPending}>
        {createModule.isPending ? "Creating..." : "Create Module"}
      </button>
    </div>
  );
}
```

## Pagination

### Server-Side Pagination

Use cursor-based pagination for better performance:

```typescript
const result = await getPaginatedModules(syllabusId, {
  page: 1,
  pageSize: 20,
  cursor: lastModuleId, // Optional cursor for cursor-based pagination
});

// Result includes:
// - modules: Array of modules
// - totalCount: Total number of modules
// - hasMore: Boolean indicating if there are more pages
// - nextCursor: Cursor for the next page
```

### Client-Side Pagination

```tsx
function PaginatedModuleList({ syllabusId }: { syllabusId: string }) {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isPreviousData } = usePaginatedModules(syllabusId, {
    page,
    pageSize,
  });

  return (
    <div>
      {data?.modules.map((module) => (
        <div key={module.id}>{module.title}</div>
      ))}

      <div>
        <button
          onClick={() => setPage((old) => Math.max(old - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => setPage((old) => (data?.hasMore ? old + 1 : old))}
          disabled={!data?.hasMore || isPreviousData}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

## Database Optimization

### Indexes

The following indexes are configured for optimal query performance:

#### Module Table
```prisma
@@unique([syllabusId, chapterNumber])  // Ensures unique chapter numbers
@@index([syllabusId, order])           // Fast ordering queries
@@index([syllabusId, chapterNumber])   // Fast chapter-based queries
```

#### SubModule Table
```prisma
@@index([moduleId, order])  // Fast ordering within modules
@@index([moduleId])         // Fast module-based queries
```

#### SyllabusDocument Table
```prisma
@@index([moduleId])              // Fast module document queries
@@index([subModuleId])           // Fast sub-module document queries
@@index([moduleId, order])       // Fast ordered module documents
@@index([subModuleId, order])    // Fast ordered sub-module documents
```

#### SubModuleProgress Table
```prisma
@@unique([subModuleId, teacherId])     // One progress per teacher per sub-module
@@index([teacherId])                   // Fast teacher progress queries
@@index([subModuleId, teacherId])      // Fast combined queries
```

### Query Optimization Tips

1. **Use Eager Loading**: Include related data in queries to avoid N+1 problems
   ```typescript
   include: {
     subModules: {
       include: {
         documents: true,
         progress: true,
       },
     },
   }
   ```

2. **Use Pagination**: For large datasets, always use pagination
   ```typescript
   take: 20,
   skip: (page - 1) * 20,
   ```

3. **Use Cursor-Based Pagination**: For better performance on large datasets
   ```typescript
   take: 20,
   cursor: { id: lastId },
   skip: 1, // Skip the cursor
   ```

4. **Select Only Needed Fields**: Reduce data transfer
   ```typescript
   select: {
     id: true,
     title: true,
     chapterNumber: true,
   }
   ```

## Performance Monitoring

### React Query DevTools

In development mode, React Query DevTools are automatically enabled:

```tsx
// Automatically included in QueryProvider
<ReactQueryDevtools initialIsOpen={false} />
```

Access DevTools by clicking the React Query icon in the bottom corner of your browser.

### Cache Statistics

Monitor cache hit rates and performance:

```typescript
import { useQueryClient } from "@tanstack/react-query";

function CacheStats() {
  const queryClient = useQueryClient();
  
  // Get all queries
  const queries = queryClient.getQueryCache().getAll();
  
  // Get cache statistics
  const stats = {
    totalQueries: queries.length,
    activeQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
    staleQueries: queries.filter(q => q.isStale()).length,
  };
  
  return <div>Cache Stats: {JSON.stringify(stats)}</div>;
}
```

## Best Practices

### 1. Use Cached Actions for Read Operations

Always use cached versions for read operations:

```typescript
// ✅ Good - Uses caching
const modules = await getCachedModulesBySyllabus(syllabusId);

// ❌ Bad - Direct database query
const modules = await db.module.findMany({ where: { syllabusId } });
```

### 2. Invalidate Caches After Mutations

Always invalidate relevant caches after mutations:

```typescript
// After creating a module
await createModule(data);
await invalidateModuleCache(moduleId, syllabusId);
```

### 3. Use Optimistic Updates

For better UX, use optimistic updates:

```typescript
const updateModule = useUpdateModule();

const handleUpdate = async (moduleId: string, newData: any) => {
  // Optimistically update the UI
  queryClient.setQueryData(
    syllabusQueryKeys.module(moduleId),
    (old: any) => ({ ...old, ...newData })
  );

  try {
    await updateModule.mutateAsync({ id: moduleId, ...newData });
  } catch (error) {
    // Revert on error
    queryClient.invalidateQueries({
      queryKey: syllabusQueryKeys.module(moduleId),
    });
  }
};
```

### 4. Configure Stale Time Appropriately

Set stale time based on data volatility:

```typescript
// Frequently changing data (progress)
staleTime: 1 * 60 * 1000, // 1 minute

// Moderately changing data (modules)
staleTime: 5 * 60 * 1000, // 5 minutes

// Rarely changing data (settings)
staleTime: 60 * 60 * 1000, // 1 hour
```

### 5. Use Pagination for Large Lists

Always paginate large lists:

```typescript
// ✅ Good - Paginated
const { data } = usePaginatedModules(syllabusId, { page: 1, pageSize: 20 });

// ❌ Bad - Fetches all data
const { data } = useModulesBySyllabus(syllabusId);
```

## Troubleshooting

### Cache Not Updating

If cache is not updating after mutations:

1. Check that cache invalidation is called
2. Verify cache tags match
3. Check React Query DevTools for query status

### Stale Data

If seeing stale data:

1. Reduce stale time
2. Enable refetchOnWindowFocus
3. Manually invalidate queries

### Performance Issues

If experiencing performance issues:

1. Check database indexes
2. Use pagination
3. Reduce included relations
4. Monitor cache hit rates

## Migration from Non-Cached Code

To migrate existing code to use caching:

1. Replace direct database queries with cached actions
2. Wrap components with QueryProvider
3. Replace useState/useEffect with React Query hooks
4. Add cache invalidation to mutations

Example:

```tsx
// Before
function ModuleList({ syllabusId }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchModules() {
      const result = await getModulesBySyllabus(syllabusId);
      setModules(result.data);
      setLoading(false);
    }
    fetchModules();
  }, [syllabusId]);

  if (loading) return <div>Loading...</div>;
  return <div>{/* render modules */}</div>;
}

// After
function ModuleList({ syllabusId }) {
  const { data: modules, isLoading } = useModulesBySyllabus(syllabusId);

  if (isLoading) return <div>Loading...</div>;
  return <div>{/* render modules */}</div>;
}
```

## Summary

The Enhanced Syllabus System's caching strategy provides:

- **Reduced Database Load**: Server-side caching reduces database queries
- **Faster Response Times**: Client-side caching eliminates network requests
- **Better UX**: Instant updates with optimistic UI
- **Scalability**: Pagination and indexes support large datasets
- **Automatic Revalidation**: Stale data is automatically refreshed

By following this guide, you can build performant syllabus management interfaces that scale well with growing data.
