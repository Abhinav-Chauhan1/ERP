# Alumni Search Optimization Guide

## Overview

This document describes the search optimization implementation for the Alumni Management system. The optimization includes database indexes, query result caching, and performance monitoring.

**Requirements:** 6.2, 6.3

## Features

### 1. Database Indexes

The following indexes have been added to the `alumni` table to optimize search queries:

#### Single-Column Indexes
- `graduationDate` - For date-based filtering and sorting
- `finalClass` - For class-based filtering
- `currentCity` - For location-based searches
- `collegeName` - For college-based searches
- `currentOccupation` - For occupation-based searches
- `currentEmployer` - For employer-based searches

#### Composite Indexes
- `(graduationDate, finalClass)` - For queries filtering by both graduation date and class
- `(finalClass, graduationDate)` - For class-based queries with date sorting
- `(currentCity, currentOccupation)` - For location and occupation combination queries

### 2. Query Result Caching

Search results are cached in memory to reduce database load and improve response times.

#### Cache Configuration
- **Cache Duration:** 10 minutes (600 seconds)
- **Cache Key Format:** `alumni:search:{filters}:page:{page}:size:{pageSize}:sort:{sortBy}:{sortOrder}`
- **Cache Storage:** In-memory cache with automatic TTL expiration

#### Cache Invalidation
The cache is automatically invalidated when:
- Alumni profile is updated
- Alumni statistics are recalculated
- Cache TTL expires (10 minutes)

### 3. Statistics Caching

Alumni statistics are cached separately with a longer TTL:
- **Cache Duration:** 30 minutes (1800 seconds)
- **Cache Key:** `alumni:statistics:all`
- **Invalidation:** Manual invalidation when alumni data changes

## Usage

### Search with Caching

The `searchAlumni` action automatically uses caching:

```typescript
import { searchAlumni } from "@/lib/actions/alumniActions";

const result = await searchAlumni({
  searchTerm: "John",
  graduationYearFrom: 2020,
  graduationYearTo: 2023,
  finalClass: "Grade 12",
  page: 1,
  pageSize: 20,
  sortBy: "graduationDate",
  sortOrder: "desc",
});
```

### Statistics with Caching

The `getAlumniStatistics` action uses caching:

```typescript
import { getAlumniStatistics } from "@/lib/actions/alumniActions";

const stats = await getAlumniStatistics();
// First call: fetches from database and caches
// Subsequent calls within 30 minutes: returns cached data
```

### Manual Cache Invalidation

To manually invalidate the cache after data changes:

```typescript
import { AlumniService } from "@/lib/services/alumniService";

const alumniService = new AlumniService();

// Invalidate all alumni caches
alumniService.invalidateCache();

// Invalidate specific alumni profile cache
alumniService.invalidateCache("alumni-id-here");
```

## Performance Benefits

### Expected Improvements

Based on typical usage patterns:

1. **Search Queries:**
   - First call: ~50-200ms (database query)
   - Cached calls: ~1-5ms (memory lookup)
   - **Improvement:** 95-99% faster

2. **Statistics Calculation:**
   - First call: ~100-500ms (aggregation query)
   - Cached calls: ~1-5ms (memory lookup)
   - **Improvement:** 95-99% faster

3. **Database Load:**
   - Reduced by 80-90% for frequently accessed queries
   - Lower connection pool usage
   - Better scalability

### Index Performance

Indexes improve query performance by:
- Reducing full table scans
- Enabling index-only scans for covered queries
- Speeding up sorting operations
- Optimizing JOIN operations with Student and User tables

## Testing

### Performance Testing Script

Run the performance test script to verify optimization:

```bash
npx tsx scripts/test-alumni-search-performance.ts
```

The script tests:
1. Search query performance with and without cache
2. Statistics calculation performance
3. Database index usage
4. Cache hit rates

### Expected Test Results

```
Test 1: Search Query Performance
--------------------------------
Testing: Search by name
  Without cache: 45.23ms
  With cache (first call): 47.12ms
  With cache (second call): 2.34ms
  Cache hit: ✅ Yes
  Performance improvement: 95.03%

Test 2: Statistics Calculation Performance
------------------------------------------
Without cache: 123.45ms
With cache: 1.89ms
Performance improvement: 98.47%
```

## Monitoring

### Cache Hit Rate

Monitor cache effectiveness in production:

```typescript
// Add to your monitoring/logging system
const cacheHitRate = (cacheHits / totalRequests) * 100;
console.log(`Alumni search cache hit rate: ${cacheHitRate}%`);
```

### Query Performance

Monitor slow queries:

```typescript
// Log queries that take longer than threshold
const threshold = 100; // ms
if (queryDuration > threshold) {
  console.warn(`Slow alumni query: ${queryDuration}ms`, filters);
}
```

## Best Practices

### 1. Cache Key Design
- Include all filter parameters in cache key
- Include pagination and sorting parameters
- Use consistent key format for easy invalidation

### 2. Cache TTL Selection
- Short TTL (5-10 min) for frequently changing data
- Long TTL (30-60 min) for statistics and aggregations
- Consider data update frequency when setting TTL

### 3. Cache Invalidation Strategy
- Invalidate on data updates (profile changes)
- Invalidate related caches (statistics when alumni added)
- Use cache tags for batch invalidation

### 4. Index Maintenance
- Monitor index usage with `pg_stat_user_indexes`
- Remove unused indexes to reduce write overhead
- Update statistics regularly with `ANALYZE`

## Troubleshooting

### Cache Not Working

If caching doesn't seem to work:

1. Check cache configuration:
   ```typescript
   import { CACHE_DURATION } from "@/lib/utils/cache";
   console.log("Alumni cache duration:", CACHE_DURATION.ALUMNI);
   ```

2. Verify cache key generation:
   ```typescript
   const alumniService = new AlumniService();
   const cacheKey = alumniService.generateSearchCacheKey(filters);
   console.log("Cache key:", cacheKey);
   ```

3. Check memory cache status:
   ```typescript
   import { memoryCache } from "@/lib/utils/cache";
   console.log("Cache has key:", memoryCache.has(cacheKey));
   ```

### Slow Queries

If queries are still slow:

1. Check if indexes are being used:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM alumni
   WHERE "graduationDate" >= '2020-01-01'
   AND "finalClass" = 'Grade 12';
   ```

2. Verify index exists:
   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'alumni';
   ```

3. Update table statistics:
   ```sql
   ANALYZE alumni;
   ```

### High Memory Usage

If cache is using too much memory:

1. Reduce cache TTL:
   ```typescript
   // In cache.ts
   ALUMNI: 300, // Reduce from 600 to 300 seconds
   ```

2. Implement cache size limits:
   ```typescript
   // Add max cache size check in MemoryCache class
   if (this.cache.size > MAX_CACHE_SIZE) {
     this.cleanup();
   }
   ```

3. Use Redis for distributed caching in production

## Migration

### Applying Index Migration

Run the migration to add indexes:

```bash
npx prisma migrate deploy
```

Or apply manually:

```bash
npx prisma db execute --file prisma/migrations/20260111_add_alumni_search_indexes/migration.sql
```

### Rollback

To remove indexes if needed:

```sql
DROP INDEX IF EXISTS "alumni_currentOccupation_idx";
DROP INDEX IF EXISTS "alumni_currentEmployer_idx";
DROP INDEX IF EXISTS "alumni_graduationDate_finalClass_idx";
DROP INDEX IF EXISTS "alumni_finalClass_graduationDate_idx";
DROP INDEX IF EXISTS "alumni_currentCity_currentOccupation_idx";
```

## Future Enhancements

### 1. Full-Text Search

Implement PostgreSQL full-text search for better text matching:

```sql
-- Add tsvector column
ALTER TABLE alumni ADD COLUMN search_vector tsvector;

-- Create GIN index
CREATE INDEX alumni_search_vector_idx ON alumni USING GIN(search_vector);

-- Update trigger to maintain search_vector
CREATE TRIGGER alumni_search_vector_update
BEFORE INSERT OR UPDATE ON alumni
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', 
  currentOccupation, currentEmployer, collegeName);
```

### 2. Redis Caching

For production environments with multiple servers:

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Cache with Redis
await redis.setex(cacheKey, CACHE_DURATION.ALUMNI, JSON.stringify(data));

// Retrieve from Redis
const cached = await redis.get(cacheKey);
```

### 3. Query Result Pagination Optimization

Implement cursor-based pagination for large result sets:

```typescript
// Use cursor instead of offset
const alumni = await db.alumni.findMany({
  where,
  take: pageSize,
  cursor: lastId ? { id: lastId } : undefined,
  skip: lastId ? 1 : 0,
});
```

### 4. Materialized Views

For complex aggregations, use materialized views:

```sql
CREATE MATERIALIZED VIEW alumni_statistics AS
SELECT
  EXTRACT(YEAR FROM "graduationDate") as year,
  "finalClass",
  "currentCity",
  COUNT(*) as count
FROM alumni
GROUP BY year, "finalClass", "currentCity";

-- Refresh periodically
REFRESH MATERIALIZED VIEW alumni_statistics;
```

## References

- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Next.js Caching Documentation](https://nextjs.org/docs/app/building-your-application/caching)
- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

