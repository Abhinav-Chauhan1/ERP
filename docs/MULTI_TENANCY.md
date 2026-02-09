# Multi-Tenancy Guide

## Overview

SikshaMitra ERP supports multi-tenancy, allowing multiple schools to operate independently within the same application instance while maintaining complete data isolation.

## Architecture

### Tenant Identification

Each school is identified by:
- **Subdomain**: `school-a.yourdomain.com`
- **Custom Domain**: `erp.schoola.edu` (optional)
- **Tenant ID**: Unique identifier in the system

### Data Isolation Strategies

#### Option 1: Database Per Tenant (Recommended)

Each school has its own PostgreSQL database.

**Advantages:**
- Complete data isolation
- Independent backups and scaling
- Better security and compliance
- No risk of data leakage
- Easier to manage per-school customizations

**Implementation:**

```typescript
// lib/db/tenant-config.ts
const TENANT_CONFIGS = {
  school_a: {
    databaseUrl: process.env.DATABASE_URL_SCHOOL_A,
    name: "ABC School"
  },
  school_b: {
    databaseUrl: process.env.DATABASE_URL_SCHOOL_B,
    name: "XYZ School"
  }
};

// lib/db/prisma-client.ts
export function getPrismaClient(tenantId: string) {
  const config = TENANT_CONFIGS[tenantId];
  return new PrismaClient({
    datasources: {
      db: { url: config.databaseUrl }
    }
  });
}
```

#### Option 2: Shared Database with Tenant Column

Single database with `schoolId` column in every table.

**Advantages:**
- Simpler infrastructure
- Cost-effective for small deployments
- Easier schema migrations

**Implementation:**

```prisma
model Student {
  id        String @id @default(cuid())
  schoolId  String
  name      String
  // ... other fields
  
  school    School @relation(fields: [schoolId], references: [id])
  
  @@index([schoolId])
}
```

## Implementation

### Middleware Setup

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Extract subdomain
  const subdomain = hostname.split('.')[0];
  
  // Skip for localhost and main domain
  if (hostname.includes('localhost') || subdomain === 'www') {
    return NextResponse.next();
  }
  
  // Add tenant info to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', subdomain);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
```

### Server Actions with Tenant Context

```typescript
// lib/db/tenant-context.ts
import { headers } from 'next/headers';
import { getPrismaClient } from './prisma-client';

export async function getTenantPrisma() {
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');
  
  if (!tenantId) {
    throw new Error('Tenant context not found');
  }
  
  return {
    prisma: getPrismaClient(tenantId),
    tenantId,
  };
}

// Usage in server actions
'use server';
export async function getStudents() {
  const { prisma } = await getTenantPrisma();
  return await prisma.student.findMany();
}
```

### API Routes with Tenant Context

```typescript
// app/api/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/prisma-client';

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  
  if (!tenantId) {
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 400 }
    );
  }
  
  const prisma = getPrismaClient(tenantId);
  const students = await prisma.student.findMany();
  
  return NextResponse.json({ success: true, data: students });
}
```

## Storage Isolation

### Cloudinary Per Tenant

```typescript
// lib/storage/cloudinary-config.ts
const CLOUDINARY_CONFIGS = {
  school_a: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME_SCHOOL_A,
    apiKey: process.env.CLOUDINARY_API_KEY_SCHOOL_A,
    apiSecret: process.env.CLOUDINARY_API_SECRET_SCHOOL_A,
  },
  school_b: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME_SCHOOL_B,
    apiKey: process.env.CLOUDINARY_API_KEY_SCHOOL_B,
    apiSecret: process.env.CLOUDINARY_API_SECRET_SCHOOL_B,
  },
};

export function getCloudinaryConfig(tenantId: string) {
  return CLOUDINARY_CONFIGS[tenantId];
}
```

### Folder-Based Isolation

```typescript
// Upload to tenant-specific folder
export async function uploadFile(tenantId: string, file: File) {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: `tenants/${tenantId}/documents`,
    tags: [tenantId],
  });
  return result;
}
```

## Database Migration

### Migrating All Tenants

```typescript
// scripts/migrate-tenants.ts
import { getAllTenants } from '@/lib/db/tenant-config';
import { execSync } from 'child_process';

async function migrateAllTenants() {
  const tenants = getAllTenants();
  
  for (const tenant of tenants) {
    console.log(`Migrating ${tenant.tenantId}...`);
    
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: tenant.databaseUrl,
      },
    });
  }
}

migrateAllTenants();
```

## Security Considerations

### Tenant Access Verification

```typescript
// lib/security/tenant-guard.ts
export async function verifyTenantAccess(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const prisma = getPrismaClient(tenantId);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  return !!user;
}
```

### Rate Limiting Per Tenant

```typescript
// lib/rate-limit/tenant-limiter.ts
export function getTenantRateLimiter(tenantId: string) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: `ratelimit:${tenantId}`,
  });
}
```

## Backup Strategy

### Per-Tenant Backups

```bash
# Backup specific tenant
pg_dump $DATABASE_URL_SCHOOL_A > backup-school-a-$(date +%Y%m%d).sql

# Automated daily backups
0 2 * * * /scripts/backup-all-tenants.sh
```

## Monitoring

### Per-Tenant Metrics

- Database size and growth
- Storage usage
- API request rates
- Active users
- Error rates

### Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  const tenants = getAllTenants();
  const health = await Promise.all(
    tenants.map(async (tenant) => ({
      tenantId: tenant.tenantId,
      database: await checkDatabase(tenant.databaseUrl),
      storage: await checkStorage(tenant.tenantId),
    }))
  );
  
  return Response.json({ tenants: health });
}
```

## Best Practices

1. **Always filter by tenant**: Never query without tenant context
2. **Validate tenant access**: Verify user belongs to tenant
3. **Isolate storage**: Use separate folders or accounts
4. **Monitor per tenant**: Track usage and performance
5. **Backup regularly**: Automated backups per tenant
6. **Test isolation**: Verify data cannot leak between tenants
7. **Document tenant setup**: Clear onboarding process
8. **Plan for scale**: Design for growth from day one

## Troubleshooting

### Tenant Not Found
- Check subdomain configuration
- Verify DNS settings
- Check middleware logic

### Data Leakage
- Audit all queries for tenant filtering
- Review middleware implementation
- Check storage isolation

### Performance Issues
- Monitor database connections per tenant
- Implement connection pooling
- Consider read replicas for large tenants

---

**Last Updated**: February 2026  
**Version**: 2.0.0
