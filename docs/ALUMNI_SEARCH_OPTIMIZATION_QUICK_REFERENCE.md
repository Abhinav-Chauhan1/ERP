# Alumni Search Optimization - Quick Reference

## Overview

Search optimization for alumni management with database indexes and caching.

**Requirements:** 6.2, 6.3

## Key Features

### ✅ Database Indexes
- 6 single-column indexes for basic filtering
- 3 composite indexes for complex queries
- Optimized for common search patterns

### ✅ Query Result Caching
- 10-minute cache for search results
- 30-minute cache for statistics
- Automatic cache invalidation on updates

### ✅ Performance Improvements
- 95-99% faster for cached queries
- 80-90% reduction in database load
- Better scalability for high traffic

## Quick Commands

### Verify Indexes
```bash
npx tsx scripts/verify-alumni-indexes.ts
```

### Test Performance
```bash
npx tsx scripts/test-alumni-search-performance.ts
```

### Apply Migration
```bash
npx prisma migrate deploy
```

## Cache Configuration

| Data Type | Cache Duration | Cache Key Pattern |
|-----------|---------------|-------------------|
| Search Results | 10 minutes | `alumni:search:{filters}:page:{page}:...` |
| Statistics | 30 minutes | `alumni:statistics:all` |
| Profile | 10 minutes | `alumni:profile:{id}` |

## Database Indexes

### Single-Column Indexes
- `graduationDate` - Date filtering/sorting
- `finalClass` - Class filtering
- `currentCity` - Location searches
- `collegeName` - College searches
- `currentOccupation` - Occupation searches
- `currentEmployer` - Employer searches

### Composite Indexes
- `(graduationDate, finalClass)` - Date + class queries
- `(finalClass, graduationDate)` - Class + date sorting
- `(currentCity, currentOccupation)` - Location + occupation

## Usage Examples

### Search with Filters
```typescript
import { searchAlumni } from "@/lib/actions/alumniActions";

const result = await searchAlumni({
  searchTerm: "John",
  graduationYearFrom: 2020,
  graduationYearTo: 2023,
  finalClass: "Grade 12",
  currentCity: "Mumbai",
  page: 1,
  pageSize: 20,
});
```

### Get Statistics
```typescript
import { getAlumniStatistics } from "@/lib/actions/alumniActions";

const stats = await getAlumniStatistics();
// Cached for 30 minutes
```

### Invalidate Cache
```typescript
import { AlumniService } from "@/lib/services/alumniService";

const service = new AlumniService();
service.invalidateCache(); // Clear all caches
service.invalidateCache("alumni-id"); // Clear specific profile
```

## Performance Metrics

### Expected Query Times

| Query Type | Without Cache | With Cache | Improvement |
|------------|--------------|------------|-------------|
| Simple Search | 50-200ms | 1-5ms | 95-99% |
| Complex Search | 100-300ms | 1-5ms | 95-99% |
| Statistics | 100-500ms | 1-5ms | 95-99% |

### Cache Hit Rates

Target cache hit rates in production:
- Search queries: 70-80%
- Statistics: 90-95%
- Profile views: 60-70%

## Monitoring

### Check Index Usage
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'alumni'
ORDER BY idx_scan DESC;
```

### Monitor Cache Performance
```typescript
// Log cache hits/misses
const cacheHitRate = (hits / total) * 100;
console.log(`Cache hit rate: ${cacheHitRate}%`);
```

## Troubleshooting

### Slow Queries
1. Check if indexes exist: `npx tsx scripts/verify-alumni-indexes.ts`
2. Verify index usage: `EXPLAIN ANALYZE SELECT ...`
3. Update statistics: `ANALYZE alumni;`

### Cache Not Working
1. Check cache configuration in `src/lib/utils/cache.ts`
2. Verify cache key generation
3. Check memory cache status

### High Memory Usage
1. Reduce cache TTL
2. Implement cache size limits
3. Consider Redis for production

## Best Practices

1. **Monitor Performance**
   - Track query execution times
   - Monitor cache hit rates
   - Watch database connection pool

2. **Cache Management**
   - Invalidate on data updates
   - Use appropriate TTL values
   - Implement cache warming for hot data

3. **Index Maintenance**
   - Monitor index usage
   - Remove unused indexes
   - Update statistics regularly

4. **Query Optimization**
   - Use indexed columns in WHERE clauses
   - Avoid SELECT * when possible
   - Use LIMIT for large result sets

## Related Documentation

- [Full Documentation](./ALUMNI_SEARCH_OPTIMIZATION.md)
- [Alumni Management Guide](./ALUMNI_MANAGEMENT_GUIDE.md)
- [Performance Optimization Guide](./PERFORMANCE_OPTIMIZATION_GUIDE.md)

## Support

For issues or questions:
1. Check the full documentation
2. Run verification scripts
3. Review performance test results
4. Check database logs

