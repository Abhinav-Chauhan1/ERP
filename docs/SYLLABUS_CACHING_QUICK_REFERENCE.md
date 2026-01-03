# Syllabus Caching - Quick Reference

## Setup (One-Time)

```tsx
// app/layout.tsx
import { QueryProvider } from "@/lib/contexts/QueryProvider";

<QueryProvider>
  <YourApp />
</QueryProvider>
```

## Client-Side Queries

```tsx
import {
  useModulesBySyllabus,
  usePaginatedModules,
  useSubModulesByModule,
  useSyllabusProgress,
} from "@/hooks/use-syllabus-queries";

// Fetch all modules
const { data, isLoading, error } = useModulesBySyllabus(syllabusId);

// Fetch paginated modules
const { data } = usePaginatedModules(syllabusId, { page: 1, pageSize: 20 });

// Fetch sub-modules
const { data } = useSubModulesByModule(moduleId);

// Fetch progress
const { data } = useSyllabusProgress(syllabusId, teacherId);
```

## Client-Side Mutations

```tsx
import {
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useReorderModules,
} from "@/hooks/use-syllabus-queries";

// Create
const createModule = useCreateModule();
await createModule.mutateAsync({ title: "New", ... });

// Update
const updateModule = useUpdateModule();
await updateModule.mutateAsync({ id, title: "Updated", ... });

// Delete
const deleteModule = useDeleteModule();
await deleteModule.mutateAsync({ id, syllabusId });

// Reorder
const reorderModules = useReorderModules();
await reorderModules.mutateAsync({ syllabusId, moduleOrders: [...] });
```

## Server-Side Cached Queries

```typescript
import {
  getCachedModulesBySyllabus,
  getCachedSubModulesByModule,
  getPaginatedModules,
  getCachedModuleById,
  getCachedSyllabusProgress,
} from "@/lib/actions/cachedModuleActions";

// Fetch modules (5 min cache)
const result = await getCachedModulesBySyllabus(syllabusId);

// Fetch paginated (5 min cache)
const result = await getPaginatedModules(syllabusId, { page: 1, pageSize: 20 });

// Fetch progress (1 min cache)
const result = await getCachedSyllabusProgress(syllabusId, teacherId);
```

## Cache Invalidation

```typescript
import {
  invalidateSyllabusCache,
  invalidateModuleCache,
  invalidateSubModuleCache,
  invalidateSyllabusProgressCache,
} from "@/lib/utils/cache-invalidation";

// After mutations
await invalidateModuleCache(moduleId, syllabusId);
await invalidateSubModuleCache(subModuleId, moduleId);
await invalidateSyllabusProgressCache(teacherId);
```

## Cache Configuration

| Data Type | Cache Duration | Rationale |
|-----------|----------------|-----------|
| Modules | 5 minutes | Moderately changing |
| Sub-Modules | 5 minutes | Moderately changing |
| Documents | 5 minutes | Moderately changing |
| Progress | 1 minute | Frequently changing |

## Query Keys

```typescript
import { syllabusQueryKeys } from "@/hooks/use-syllabus-queries";

syllabusQueryKeys.modules(syllabusId)
syllabusQueryKeys.modulesPaginated(syllabusId, page, pageSize)
syllabusQueryKeys.module(moduleId)
syllabusQueryKeys.subModules(moduleId)
syllabusQueryKeys.progress(syllabusId, teacherId)
```

## Common Patterns

### Loading State
```tsx
if (isLoading) return <Skeleton />;
```

### Error State
```tsx
if (error) return <Alert>{error.message}</Alert>;
```

### Pagination
```tsx
const [page, setPage] = useState(1);
const { data } = usePaginatedModules(syllabusId, { page, pageSize: 20 });

<Button onClick={() => setPage(p => p + 1)} disabled={!data?.hasMore}>
  Next
</Button>
```

### Optimistic Update
```tsx
const queryClient = useQueryClient();

// Optimistically update
queryClient.setQueryData(
  syllabusQueryKeys.module(id),
  (old) => ({ ...old, ...newData })
);

// Revert on error
try {
  await mutation.mutateAsync(data);
} catch {
  queryClient.invalidateQueries({ queryKey: syllabusQueryKeys.module(id) });
}
```

## Debugging

### React Query DevTools
```tsx
// Automatically enabled in development
// Click the React Query icon in bottom corner
```

### Cache Stats
```tsx
const queryClient = useQueryClient();
const queries = queryClient.getQueryCache().getAll();
console.log('Total queries:', queries.length);
```

## Performance Tips

1. **Use pagination** for lists > 50 items
2. **Set appropriate stale times** based on data volatility
3. **Enable prefetching** for anticipated actions
4. **Use optimistic updates** for better UX
5. **Monitor cache hit rates** with DevTools

## Troubleshooting

### Cache not updating?
- Check cache invalidation is called
- Verify cache tags match
- Check React Query DevTools

### Stale data?
- Reduce stale time
- Enable refetchOnWindowFocus
- Manually invalidate queries

### Performance issues?
- Check database indexes
- Use pagination
- Reduce included relations
- Monitor cache hit rates

## Full Documentation

See `docs/SYLLABUS_CACHING_GUIDE.md` for comprehensive documentation.
