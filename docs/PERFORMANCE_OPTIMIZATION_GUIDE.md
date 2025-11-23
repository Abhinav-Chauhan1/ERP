# Performance Optimization Guide

This guide documents all performance optimizations implemented in the School ERP system to achieve performance scores > 90.

## Table of Contents

1. [Overview](#overview)
2. [Bundle Size Optimization](#bundle-size-optimization)
3. [Code Splitting](#code-splitting)
4. [Database Query Optimization](#database-query-optimization)
5. [Caching Strategy](#caching-strategy)
6. [Image Optimization](#image-optimization)
7. [Performance Monitoring](#performance-monitoring)
8. [Lighthouse Audit Process](#lighthouse-audit-process)
9. [Performance Checklist](#performance-checklist)

## Overview

The ERP system has been optimized to achieve:
- **Performance Score**: > 90/100
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Database Query Time**: < 500ms
- **CLS Score**: < 0.1

## Bundle Size Optimization

### 1. Next.js Configuration

The `next.config.js` has been optimized with:

```javascript
{
  swcMinify: true, // Fast minification
  compiler: {
    removeConsole: true, // Remove console logs in production
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
    optimizeCss: true,
  },
}
```

### 2. Webpack Bundle Splitting

Custom webpack configuration splits bundles efficiently:

- **Vendor chunk**: All node_modules
- **Common chunk**: Shared code across pages
- **Library-specific chunks**: Recharts, Radix UI

### 3. Tree Shaking

Ensure proper tree shaking by:
- Using named imports: `import { Button } from '@/components/ui/button'`
- Avoiding default exports for utilities
- Using `"sideEffects": false` in package.json

### 4. Bundle Analysis

Run bundle analysis:

```bash
npm run build
tsx scripts/analyze-bundle.ts
```

This generates a report identifying:
- Bundles > 200KB
- Duplicate dependencies
- Optimization opportunities

## Code Splitting

### Dynamic Imports

Heavy components are dynamically imported using `src/lib/utils/dynamic-imports.ts`:

```typescript
import { DynamicChart } from '@/lib/utils/dynamic-imports';

// Component loads only when needed
<DynamicChart data={data} />
```

### Dynamically Loaded Components

- **Charts** (Recharts ~100KB): Loaded on demand
- **Date Pickers** (~50KB): Loaded on demand
- **PDF Generators** (jsPDF): Loaded on demand
- **Export Dialogs** (xlsx): Loaded on demand
- **Rich Text Editors**: Loaded on demand

### Route-Based Code Splitting

Next.js automatically splits code by route. Each page bundle is separate:

```
/admin/dashboard -> admin-dashboard.js
/student/academics -> student-academics.js
/teacher/courses -> teacher-courses.js
```

### Preloading

Preload components that will be needed soon:

```typescript
import { preloadComponent } from '@/lib/utils/dynamic-imports';

// Preload on hover
onMouseEnter={() => preloadComponent('Chart')}
```

## Database Query Optimization

### 1. Composite Indexes

Added composite indexes for frequently queried fields:

```prisma
model StudentAttendance {
  @@index([studentId, date])
  @@index([sectionId, date, status])
  @@index([date, status])
}

model ExamResult {
  @@index([studentId, examId])
  @@index([examId, marks])
  @@index([studentId, createdAt])
}

model FeePayment {
  @@index([studentId, status, paymentDate])
  @@index([status, paymentDate])
}
```

### 2. N+1 Query Prevention

Use optimized includes from `src/lib/utils/query-optimization.ts`:

```typescript
import { optimizedStudentInclude } from '@/lib/utils/query-optimization';

const students = await prisma.student.findMany({
  include: optimizedStudentInclude,
});
```

### 3. Pagination

Always paginate large datasets:

```typescript
import { getPaginationParams, createPaginationResult } from '@/lib/utils/query-optimization';

const { skip, take } = getPaginationParams({ page: 1, pageSize: 50 });

const [data, totalCount] = await Promise.all([
  prisma.student.findMany({ skip, take }),
  prisma.student.count(),
]);

return createPaginationResult(data, totalCount, { page: 1, pageSize: 50 });
```

### 4. Query Performance Monitoring

Monitor slow queries:

```typescript
import { QueryPerformanceMonitor } from '@/lib/utils/performance-monitor';

const students = await QueryPerformanceMonitor.track(
  'getStudents',
  () => prisma.student.findMany()
);
```

### 5. Connection Pooling

Prisma connection pooling is configured in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pool: 10-20 connections
}
```

### 6. Aggregation Queries

Use database aggregations instead of fetching all records:

```typescript
// ❌ Bad: Fetch all and count in JS
const students = await prisma.student.findMany();
const count = students.length;

// ✅ Good: Use database aggregation
const count = await prisma.student.count();
```

## Caching Strategy

### 1. Next.js Cache

Use `unstable_cache` for frequently accessed data:

```typescript
import { unstable_cache } from 'next/cache';

export const getCachedAcademicYears = unstable_cache(
  async () => prisma.academicYear.findMany(),
  ['academic-years'],
  { revalidate: 3600, tags: ['academic-years'] }
);
```

### 2. Cache Invalidation

Invalidate cache on mutations:

```typescript
import { revalidateTag } from 'next/cache';

// After updating academic year
revalidateTag('academic-years');
```

### 3. Request Memoization

Next.js automatically deduplicates identical requests within a single render.

### 4. Static Caching

Static data is cached automatically:
- Academic years: 1 hour
- Terms: 1 hour
- Classes: 30 minutes

## Image Optimization

### 1. Next.js Image Component

Always use Next.js Image component:

```tsx
import Image from 'next/image';

<Image
  src="/student-photo.jpg"
  alt="Student photo"
  width={200}
  height={200}
  loading="lazy"
  placeholder="blur"
/>
```

### 2. Modern Formats

Images are automatically converted to WebP and AVIF:

```javascript
// next.config.js
images: {
  formats: ['image/avif', 'image/webp'],
}
```

### 3. Responsive Images

Multiple sizes are generated for different devices:

```javascript
deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
```

### 4. Lazy Loading

Images below the fold are lazy loaded:

```tsx
<Image loading="lazy" />
```

### 5. Priority Loading

Above-the-fold images use priority:

```tsx
<Image priority />
```

## Performance Monitoring

### 1. Web Vitals Tracking

Track Core Web Vitals in `src/app/layout.tsx`:

```typescript
import { reportWebVitals } from '@/lib/utils/performance-monitor';

export function reportWebVitals(metric: Metric) {
  // Sends to analytics
}
```

### 2. API Performance Monitoring

Track API response times:

```typescript
import { APIPerformanceMonitor } from '@/lib/utils/performance-monitor';

APIPerformanceMonitor.track(endpoint, method, duration, status);
```

### 3. Query Performance Monitoring

Track database query times:

```typescript
import { QueryPerformanceMonitor } from '@/lib/utils/performance-monitor';

const result = await QueryPerformanceMonitor.track('queryName', queryFn);
```

### 4. Performance Budgets

Set and check performance budgets:

```typescript
import { PerformanceBudget } from '@/lib/utils/performance-monitor';

PerformanceBudget.checkPageLoadTime(duration);
PerformanceBudget.checkAPIResponseTime(duration);
```

## Lighthouse Audit Process

### 1. Run Lighthouse Audits

```bash
# Start the development server
npm run dev

# In another terminal, run audits
tsx scripts/lighthouse-audit.ts
```

### 2. Review Results

Lighthouse reports are saved to `lighthouse-reports/`:
- Individual page reports (JSON)
- Summary report (SUMMARY.md)

### 3. Target Scores

- **Performance**: > 90/100
- **Accessibility**: > 90/100
- **Best Practices**: > 90/100
- **SEO**: > 90/100

### 4. Core Web Vitals Targets

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **FCP** (First Contentful Paint): < 1.8s
- **TTFB** (Time to First Byte): < 800ms

## Performance Checklist

### Before Deployment

- [ ] Run `npm run build` successfully
- [ ] Run bundle analysis: `tsx scripts/analyze-bundle.ts`
- [ ] Run Lighthouse audits: `tsx scripts/lighthouse-audit.ts`
- [ ] Verify all scores > 90
- [ ] Check CLS < 0.1
- [ ] Verify no bundles > 200KB
- [ ] Test on slow 3G network
- [ ] Test on mobile devices
- [ ] Verify images are optimized
- [ ] Check database query performance
- [ ] Verify caching is working
- [ ] Test with 100+ concurrent users

### Ongoing Monitoring

- [ ] Monitor Web Vitals in production
- [ ] Track API response times
- [ ] Monitor database query performance
- [ ] Review slow query logs
- [ ] Check bundle sizes on each deployment
- [ ] Run Lighthouse audits monthly
- [ ] Review performance metrics dashboard

### Common Issues and Solutions

#### Issue: Large Bundle Size

**Solution:**
1. Use dynamic imports for heavy components
2. Implement code splitting
3. Remove unused dependencies
4. Use tree shaking

#### Issue: Slow Page Load

**Solution:**
1. Optimize images
2. Implement lazy loading
3. Use caching
4. Minimize JavaScript

#### Issue: High CLS

**Solution:**
1. Add dimensions to images
2. Use skeleton loaders
3. Reserve space for dynamic content
4. Optimize font loading

#### Issue: Slow Database Queries

**Solution:**
1. Add composite indexes
2. Use pagination
3. Prevent N+1 queries
4. Use aggregation queries

#### Issue: Slow API Response

**Solution:**
1. Implement caching
2. Optimize database queries
3. Use connection pooling
4. Implement rate limiting

## Best Practices

### 1. Always Use Pagination

```typescript
// ❌ Bad: Fetch all records
const students = await prisma.student.findMany();

// ✅ Good: Use pagination
const students = await prisma.student.findMany({
  skip: 0,
  take: 50,
});
```

### 2. Optimize Images

```tsx
// ❌ Bad: Use img tag
<img src="/photo.jpg" />

// ✅ Good: Use Next.js Image
<Image src="/photo.jpg" width={200} height={200} />
```

### 3. Use Dynamic Imports

```typescript
// ❌ Bad: Import heavy component directly
import { Chart } from '@/components/dashboard/chart';

// ✅ Good: Use dynamic import
import { DynamicChart } from '@/lib/utils/dynamic-imports';
```

### 4. Prevent N+1 Queries

```typescript
// ❌ Bad: N+1 query
const students = await prisma.student.findMany();
for (const student of students) {
  const section = await prisma.section.findUnique({
    where: { id: student.sectionId },
  });
}

// ✅ Good: Include relations
const students = await prisma.student.findMany({
  include: { section: true },
});
```

### 5. Use Caching

```typescript
// ❌ Bad: Query on every request
const academicYears = await prisma.academicYear.findMany();

// ✅ Good: Use caching
const academicYears = await getCachedAcademicYears();
```

## Resources

- [Next.js Performance Documentation](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

## Support

For performance-related issues:
1. Check this guide first
2. Run performance audits
3. Review monitoring dashboards
4. Contact the development team
