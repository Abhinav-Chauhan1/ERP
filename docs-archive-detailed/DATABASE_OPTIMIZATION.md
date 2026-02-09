# Database Optimization Guide

## Connection Pooling Configuration

### Current Setup
The application uses Neon PostgreSQL with built-in connection pooling via the `-pooler` endpoint.

### Connection Pool Settings
To configure connection pooling parameters, update your `DATABASE_URL` in `.env`:

```
DATABASE_URL='postgresql://user:password@host-pooler.region.aws.neon.tech/database?sslmode=require&connection_limit=10&pool_timeout=20'
```

**Parameters:**
- `connection_limit=10`: Minimum 10 connections in the pool (as per requirements)
- `pool_timeout=20`: Connection timeout in seconds

### Neon Pooler
Neon's pooler automatically manages connections. The current URL already uses the pooler endpoint (`-pooler`), which provides:
- Connection pooling at the infrastructure level
- Automatic connection management
- Reduced connection overhead

### Prisma Client Configuration
The Prisma client in `src/lib/db.ts` is configured with:
- Query logging in development mode
- Error logging in production
- Singleton pattern to prevent multiple instances

## Database Indexes

### Added Composite Indexes

#### StudentAttendance
- `@@index([studentId, date])` - For querying student attendance by date
- `@@index([sectionId, date, status])` - For section-wise attendance reports with status filtering
- `@@index([status])` - For filtering by attendance status

#### ExamResult
- `@@index([studentId, examId])` - For student exam results lookup
- `@@index([examId, marks])` - For ranking students by marks in an exam
- `@@index([studentId, createdAt])` - For student result history

#### FeePayment
- `@@index([studentId, status, paymentDate])` - For student payment history with status filtering
- `@@index([paymentDate])` - For payment reports by date
- `@@index([status])` - For filtering payments by status

## N+1 Query Prevention

### Best Practices
1. **Use Prisma `include`**: Always include related data in a single query
2. **Use `select` with nested includes**: Optimize data fetching
3. **Avoid loops with individual queries**: Batch queries when possible

### Common Patterns

#### ❌ Bad (N+1 Query)
```typescript
const students = await db.student.findMany();
for (const student of students) {
  const user = await db.user.findUnique({ where: { id: student.userId } });
}
```

#### ✅ Good (Single Query)
```typescript
const students = await db.student.findMany({
  include: {
    user: true
  }
});
```

### Query Optimization Checklist
- [ ] All list queries use pagination (max 50 records per page)
- [ ] Related data is fetched using `include` or `select`
- [ ] Composite indexes are used for frequently queried field combinations
- [ ] Connection pooling is configured (minimum 10 connections)
- [ ] Slow queries (>1 second) are logged and optimized

## Performance Monitoring

### Query Performance
Monitor query performance using Prisma's logging:
```typescript
const db = new PrismaClient({
  log: ['query', 'error', 'warn']
});
```

### Slow Query Detection
Queries exceeding 1 second should be logged and optimized. Consider:
1. Adding appropriate indexes
2. Reducing data fetched with `select`
3. Implementing pagination
4. Using database views for complex queries

## Migration

After updating the schema, run:
```bash
npx prisma migrate dev --name add_composite_indexes
npx prisma generate
```

## Testing

Verify index usage with PostgreSQL EXPLAIN:
```sql
EXPLAIN ANALYZE SELECT * FROM "StudentAttendance" 
WHERE "studentId" = 'xxx' AND "date" >= '2024-01-01';
```

The query plan should show "Index Scan" instead of "Seq Scan" for optimal performance.
