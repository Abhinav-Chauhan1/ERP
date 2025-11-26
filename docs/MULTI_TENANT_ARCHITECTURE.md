# Multi-Tenant Architecture Guide

Complete guide for implementing multi-school support with separate databases and storage for each school in the same application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tenant Identification Strategies](#tenant-identification-strategies)
3. [Database Strategies](#database-strategies)
4. [Storage Strategies](#storage-strategies)
5. [Implementation Guide](#implementation-guide)
6. [Security Considerations](#security-considerations)
7. [Migration Guide](#migration-guide)

---

## Architecture Overview

### Multi-Tenancy Models

There are three main approaches to multi-tenancy:

#### 1. **Database Per Tenant (Recommended for Schools)**
Each school has its own separate database.

**Pros:**
- Complete data isolation
- Easy to backup/restore individual schools
- Better performance (no tenant filtering)
- Easier compliance with data regulations
- Can customize schema per school if needed

**Cons:**
- More complex infrastructure
- Higher resource usage
- Schema migrations across multiple databases

#### 2. **Schema Per Tenant**
Single database, separate schema for each school.

**Pros:**
- Better resource utilization than separate databases
- Good data isolation
- Easier to manage than multiple databases

**Cons:**
- Limited by database connection limits
- More complex queries
- Schema migrations still complex

#### 3. **Shared Database with Tenant Column**
Single database, tenant ID column in every table.

**Pros:**
- Simplest to implement
- Most cost-effective
- Easy schema migrations

**Cons:**
- Risk of data leakage
- Performance issues with large datasets
- Complex queries with tenant filtering


### Recommended Architecture for School ERP

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│              (Single Next.js Application)                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Tenant Resolution Layer                    │
│         (Identifies school from domain/subdomain)           │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   School A   │    │   School B   │    │   School C   │
│   Database   │    │   Database   │    │   Database   │
│  PostgreSQL  │    │  PostgreSQL  │    │  PostgreSQL  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   School A   │    │   School B   │    │   School C   │
│   Storage    │    │   Storage    │    │   Storage    │
│  Cloudinary  │    │  Cloudinary  │    │  Cloudinary  │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## Tenant Identification Strategies

### 1. Subdomain-Based (Recommended)

Each school gets a unique subdomain:
- `schoola.yourerp.com`
- `schoolb.yourerp.com`
- `schoolc.yourerp.com`

**Implementation:**

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Extract subdomain
  const subdomain = hostname.split('.')[0];
  
  // Skip for localhost and main domain
  if (hostname.includes('localhost') || subdomain === 'www' || subdomain === 'yourerp') {
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

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 2. Custom Domain-Based

Each school can use their own domain:
- `erp.schoola.edu`
- `portal.schoolb.com`
- `app.schoolc.org`

**Implementation:**

```typescript
// lib/tenant/domain-mapping.ts
const DOMAIN_TENANT_MAP: Record<string, string> = {
  'erp.schoola.edu': 'school_a',
  'portal.schoolb.com': 'school_b',
  'app.schoolc.org': 'school_c',
  'localhost:3000': 'demo_school', // For development
};

export function getTenantFromDomain(hostname: string): string | null {
  return DOMAIN_TENANT_MAP[hostname] || null;
}

// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const tenantId = getTenantFromDomain(hostname);
  
  if (!tenantId) {
    return NextResponse.redirect(new URL('/tenant-not-found', request.url));
  }
  
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenantId);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
```

### 3. Path-Based

Use URL path to identify tenant:
- `yourerp.com/schoola/...`
- `yourerp.com/schoolb/...`

**Less recommended** as it's less clean and can cause routing issues.


---

## Database Strategies

### Strategy 1: Database Per Tenant (Recommended)

Each school has a completely separate PostgreSQL database.

#### Database Configuration

```typescript
// lib/db/tenant-config.ts
interface TenantConfig {
  tenantId: string;
  databaseUrl: string;
  name: string;
  active: boolean;
}

const TENANT_CONFIGS: Record<string, TenantConfig> = {
  school_a: {
    tenantId: 'school_a',
    databaseUrl: process.env.DATABASE_URL_SCHOOL_A!,
    name: 'ABC High School',
    active: true,
  },
  school_b: {
    tenantId: 'school_b',
    databaseUrl: process.env.DATABASE_URL_SCHOOL_B!,
    name: 'XYZ International School',
    active: true,
  },
  demo_school: {
    tenantId: 'demo_school',
    databaseUrl: process.env.DATABASE_URL_DEMO!,
    name: 'Demo School',
    active: true,
  },
};

export function getTenantConfig(tenantId: string): TenantConfig | null {
  return TENANT_CONFIGS[tenantId] || null;
}

export function getAllTenants(): TenantConfig[] {
  return Object.values(TENANT_CONFIGS).filter(t => t.active);
}
```

#### Environment Variables

```env
# .env
# School A Database
DATABASE_URL_SCHOOL_A="postgresql://user:pass@host:5432/school_a_db"

# School B Database
DATABASE_URL_SCHOOL_B="postgresql://user:pass@host:5432/school_b_db"

# Demo School Database
DATABASE_URL_DEMO="postgresql://user:pass@host:5432/demo_school_db"

# Master Database (for tenant management)
DATABASE_URL_MASTER="postgresql://user:pass@host:5432/master_db"
```

#### Dynamic Prisma Client

```typescript
// lib/db/prisma-client.ts
import { PrismaClient } from '@prisma/client';
import { getTenantConfig } from './tenant-config';

// Cache Prisma clients per tenant
const prismaClients = new Map<string, PrismaClient>();

export function getPrismaClient(tenantId: string): PrismaClient {
  // Return cached client if exists
  if (prismaClients.has(tenantId)) {
    return prismaClients.get(tenantId)!;
  }

  // Get tenant configuration
  const config = getTenantConfig(tenantId);
  if (!config) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  // Create new Prisma client with tenant's database URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Cache the client
  prismaClients.set(tenantId, prisma);

  return prisma;
}

// Cleanup function
export async function disconnectAllClients() {
  for (const [tenantId, client] of prismaClients.entries()) {
    await client.$disconnect();
    prismaClients.delete(tenantId);
  }
}
```

#### Usage in API Routes

```typescript
// app/api/student/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db/prisma-client';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant ID from headers (set by middleware)
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    // Get tenant-specific Prisma client
    const prisma = getPrismaClient(tenantId);

    // Query tenant's database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        student: {
          include: {
            enrollments: true,
            attendance: {
              where: {
                date: {
                  gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
              },
            },
          },
        },
      },
    });

    if (!user?.student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Return data
    return NextResponse.json({
      success: true,
      data: {
        student: user.student,
        // ... other data
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```


#### Server Actions with Tenant Context

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
// actions/student/get-dashboard.ts
'use server';

import { getTenantPrisma } from '@/lib/db/tenant-context';
import { auth } from '@clerk/nextjs/server';

export async function getStudentDashboard() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const { prisma, tenantId } = await getTenantPrisma();

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      student: {
        include: {
          enrollments: true,
          attendance: true,
        },
      },
    },
  });

  return user?.student;
}
```

### Strategy 2: Master Database for Tenant Management

Keep a master database to manage tenant information and routing.

```typescript
// prisma/schema-master.prisma
model Tenant {
  id            String   @id @default(cuid())
  tenantId      String   @unique // e.g., "school_a"
  name          String   // School name
  subdomain     String?  @unique
  customDomain  String?  @unique
  databaseUrl   String   // Encrypted database URL
  active        Boolean  @default(true)
  
  // Subscription info
  plan          String   @default("basic") // basic, premium, enterprise
  maxStudents   Int      @default(500)
  maxTeachers   Int      @default(50)
  
  // Contact info
  adminEmail    String
  adminPhone    String?
  
  // Billing
  billingEmail  String?
  subscriptionEnds DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([subdomain])
  @@index([customDomain])
  @@index([active])
}

model TenantSettings {
  id        String @id @default(cuid())
  tenantId  String @unique
  
  // Feature flags
  features  Json   // { lms: true, hostel: false, transport: true }
  
  // Branding
  logo      String?
  primaryColor String @default("#3b82f6")
  
  // Integrations
  cloudinaryCloudName String?
  cloudinaryApiKey    String?
  razorpayKeyId       String?
  twilioAccountSid    String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Master Database Client

```typescript
// lib/db/master-db.ts
import { PrismaClient } from '@prisma/client-master'; // Separate generated client

let masterPrisma: PrismaClient;

export function getMasterPrisma(): PrismaClient {
  if (!masterPrisma) {
    masterPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL_MASTER,
        },
      },
    });
  }
  return masterPrisma;
}

// Get tenant by subdomain
export async function getTenantBySubdomain(subdomain: string) {
  const prisma = getMasterPrisma();
  return prisma.tenant.findUnique({
    where: { subdomain },
    include: { settings: true },
  });
}

// Get tenant by custom domain
export async function getTenantByDomain(domain: string) {
  const prisma = getMasterPrisma();
  return prisma.tenant.findUnique({
    where: { customDomain: domain },
    include: { settings: true },
  });
}
```


---

## Storage Strategies

### Cloudinary Multi-Tenant Setup

Each school gets its own Cloudinary cloud or folder structure.

#### Option 1: Separate Cloudinary Accounts (Recommended)

Each school has its own Cloudinary account.

```typescript
// lib/storage/cloudinary-config.ts
interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset: string;
}

const CLOUDINARY_CONFIGS: Record<string, CloudinaryConfig> = {
  school_a: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME_SCHOOL_A!,
    apiKey: process.env.CLOUDINARY_API_KEY_SCHOOL_A!,
    apiSecret: process.env.CLOUDINARY_API_SECRET_SCHOOL_A!,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET_SCHOOL_A!,
  },
  school_b: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME_SCHOOL_B!,
    apiKey: process.env.CLOUDINARY_API_KEY_SCHOOL_B!,
    apiSecret: process.env.CLOUDINARY_API_SECRET_SCHOOL_B!,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET_SCHOOL_B!,
  },
};

export function getCloudinaryConfig(tenantId: string): CloudinaryConfig {
  const config = CLOUDINARY_CONFIGS[tenantId];
  if (!config) {
    throw new Error(`Cloudinary config not found for tenant: ${tenantId}`);
  }
  return config;
}
```

```typescript
// lib/storage/upload.ts
import { v2 as cloudinary } from 'cloudinary';
import { getCloudinaryConfig } from './cloudinary-config';

export async function uploadFile(
  tenantId: string,
  file: File,
  folder: string = 'general'
) {
  const config = getCloudinaryConfig(tenantId);
  
  // Configure Cloudinary for this tenant
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
  });

  // Upload file
  const result = await cloudinary.uploader.upload(file.path, {
    folder: `${tenantId}/${folder}`,
    resource_type: 'auto',
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    size: result.bytes,
  };
}

export async function deleteFile(tenantId: string, publicId: string) {
  const config = getCloudinaryConfig(tenantId);
  
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
  });

  await cloudinary.uploader.destroy(publicId);
}
```

#### Option 2: Single Cloudinary Account with Folders

Use one Cloudinary account with tenant-specific folders.

```typescript
// lib/storage/cloudinary-single.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadFile(
  tenantId: string,
  file: File,
  folder: string = 'general'
) {
  // Upload to tenant-specific folder
  const result = await cloudinary.uploader.upload(file.path, {
    folder: `tenants/${tenantId}/${folder}`,
    resource_type: 'auto',
    // Add tenant tag for easy filtering
    tags: [tenantId],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    size: result.bytes,
  };
}

// Get all files for a tenant
export async function getTenantFiles(tenantId: string) {
  const result = await cloudinary.api.resources_by_tag(tenantId, {
    max_results: 500,
  });
  return result.resources;
}

// Delete tenant folder (when school is removed)
export async function deleteTenantFolder(tenantId: string) {
  await cloudinary.api.delete_resources_by_prefix(`tenants/${tenantId}/`);
  await cloudinary.api.delete_folder(`tenants/${tenantId}`);
}
```

### File Upload API with Tenant Context

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadFile } from '@/lib/storage/upload';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to tenant-specific storage
    const result = await uploadFile(tenantId, file, folder);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```


---

## Implementation Guide

### Step 1: Setup Master Database

```bash
# Create master database
createdb school_erp_master

# Create tenant databases
createdb school_a_db
createdb school_b_db
```

### Step 2: Configure Environment

```env
# .env

# Master Database
DATABASE_URL_MASTER="postgresql://user:pass@localhost:5432/school_erp_master"

# Tenant Databases
DATABASE_URL_SCHOOL_A="postgresql://user:pass@localhost:5432/school_a_db"
DATABASE_URL_SCHOOL_B="postgresql://user:pass@localhost:5432/school_b_db"

# Cloudinary - School A
CLOUDINARY_CLOUD_NAME_SCHOOL_A="school-a-cloud"
CLOUDINARY_API_KEY_SCHOOL_A="xxx"
CLOUDINARY_API_SECRET_SCHOOL_A="xxx"

# Cloudinary - School B
CLOUDINARY_CLOUD_NAME_SCHOOL_B="school-b-cloud"
CLOUDINARY_API_KEY_SCHOOL_B="xxx"
CLOUDINARY_API_SECRET_SCHOOL_B="xxx"
```

### Step 3: Update Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTenantBySubdomain, getTenantByDomain } from '@/lib/db/master-db';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Skip for API routes that don't need tenant context
  if (request.nextUrl.pathname.startsWith('/api/public')) {
    return NextResponse.next();
  }

  let tenantId: string | null = null;

  // Check if custom domain
  if (!hostname.includes('yourerp.com') && !hostname.includes('localhost')) {
    const tenant = await getTenantByDomain(hostname);
    tenantId = tenant?.tenantId || null;
  } else {
    // Extract subdomain
    const subdomain = hostname.split('.')[0];
    
    if (subdomain !== 'www' && subdomain !== 'yourerp' && !hostname.includes('localhost')) {
      const tenant = await getTenantBySubdomain(subdomain);
      tenantId = tenant?.tenantId || null;
    } else if (hostname.includes('localhost')) {
      // For development
      tenantId = 'demo_school';
    }
  }

  if (!tenantId) {
    return NextResponse.redirect(new URL('/tenant-not-found', request.url));
  }

  // Add tenant info to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenantId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

### Step 4: Create Tenant Management API

```typescript
// app/api/admin/tenants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMasterPrisma } from '@/lib/db/master-db';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // Only super admin can create tenants
    const { userId } = await auth();
    // Add super admin check here

    const body = await request.json();
    const {
      tenantId,
      name,
      subdomain,
      customDomain,
      databaseUrl,
      adminEmail,
      plan,
    } = body;

    const prisma = getMasterPrisma();

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        tenantId,
        name,
        subdomain,
        customDomain,
        databaseUrl, // Should be encrypted
        adminEmail,
        plan,
        active: true,
      },
    });

    // Initialize tenant database (run migrations)
    await initializeTenantDatabase(databaseUrl);

    return NextResponse.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error('Tenant creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}

// Get all tenants
export async function GET() {
  try {
    const prisma = getMasterPrisma();
    const tenants = await prisma.tenant.findMany({
      where: { active: true },
      include: { settings: true },
    });

    return NextResponse.json({
      success: true,
      data: tenants,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}
```


### Step 5: Database Migration Script

```typescript
// scripts/migrate-tenant.ts
import { execSync } from 'child_process';
import { getTenantConfig, getAllTenants } from '@/lib/db/tenant-config';

async function migrateTenant(tenantId: string) {
  console.log(`Migrating tenant: ${tenantId}`);
  
  const config = getTenantConfig(tenantId);
  if (!config) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  // Set DATABASE_URL for this tenant
  process.env.DATABASE_URL = config.databaseUrl;

  try {
    // Run Prisma migrations
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: config.databaseUrl,
      },
    });

    console.log(`✓ Migration completed for ${tenantId}`);
  } catch (error) {
    console.error(`✗ Migration failed for ${tenantId}:`, error);
    throw error;
  }
}

async function migrateAllTenants() {
  const tenants = getAllTenants();
  
  console.log(`Migrating ${tenants.length} tenants...`);

  for (const tenant of tenants) {
    await migrateTenant(tenant.tenantId);
  }

  console.log('All migrations completed!');
}

// Run migrations
migrateAllTenants().catch(console.error);
```

```bash
# Run migration for all tenants
npm run migrate:tenants

# Or add to package.json
{
  "scripts": {
    "migrate:tenants": "tsx scripts/migrate-tenant.ts"
  }
}
```

### Step 6: Seed Tenant Database

```typescript
// scripts/seed-tenant.ts
import { getPrismaClient } from '@/lib/db/prisma-client';
import { hash } from 'bcryptjs';

async function seedTenant(tenantId: string) {
  console.log(`Seeding tenant: ${tenantId}`);
  
  const prisma = getPrismaClient(tenantId);

  try {
    // Create academic year
    const academicYear = await prisma.academicYear.create({
      data: {
        name: '2024-2025',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2025-03-31'),
        isCurrent: true,
      },
    });

    // Create departments
    const mathDept = await prisma.department.create({
      data: {
        name: 'Mathematics',
        description: 'Mathematics Department',
      },
    });

    // Create subjects
    await prisma.subject.createMany({
      data: [
        {
          name: 'Mathematics',
          code: 'MATH101',
          departmentId: mathDept.id,
        },
        {
          name: 'Physics',
          code: 'PHY101',
          departmentId: mathDept.id,
        },
      ],
    });

    // Create classes
    await prisma.class.create({
      data: {
        name: 'Grade 10',
        academicYearId: academicYear.id,
        sections: {
          create: [
            { name: 'A', capacity: 40 },
            { name: 'B', capacity: 40 },
          ],
        },
      },
    });

    console.log(`✓ Seeding completed for ${tenantId}`);
  } catch (error) {
    console.error(`✗ Seeding failed for ${tenantId}:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Usage
const tenantId = process.argv[2];
if (!tenantId) {
  console.error('Please provide tenant ID');
  process.exit(1);
}

seedTenant(tenantId).catch(console.error);
```

```bash
# Seed specific tenant
npm run seed:tenant school_a
```


---

## Security Considerations

### 1. Tenant Isolation

**Critical**: Ensure complete data isolation between tenants.

```typescript
// lib/security/tenant-guard.ts
import { auth } from '@clerk/nextjs/server';
import { getPrismaClient } from '@/lib/db/prisma-client';

export async function verifyTenantAccess(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const prisma = getPrismaClient(tenantId);
  
  // Check if user belongs to this tenant
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  return !!user;
}

// Middleware to verify tenant access
export async function requireTenantAccess(
  request: NextRequest
): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) {
    throw new Error('Tenant not found');
  }

  const hasAccess = await verifyTenantAccess(userId, tenantId);
  if (!hasAccess) {
    throw new Error('Access denied to this tenant');
  }

  return tenantId;
}
```

### 2. Database Connection Security

```typescript
// lib/db/secure-config.ts
import { decrypt } from '@/lib/crypto';

export function getSecureDatabaseUrl(encryptedUrl: string): string {
  // Decrypt database URL stored in master database
  return decrypt(encryptedUrl, process.env.ENCRYPTION_KEY!);
}

// Encrypt database URLs before storing
export function encryptDatabaseUrl(url: string): string {
  return encrypt(url, process.env.ENCRYPTION_KEY!);
}
```

### 3. Rate Limiting Per Tenant

```typescript
// lib/rate-limit/tenant-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Create rate limiter per tenant
export function getTenantRateLimiter(tenantId: string) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: `ratelimit:${tenantId}`,
  });
}

// Usage in API route
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!;
  const limiter = getTenantRateLimiter(tenantId);
  
  const { success } = await limiter.limit(tenantId);
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  
  // Continue with request
}
```

### 4. Audit Logging

```typescript
// lib/audit/tenant-audit.ts
import { getPrismaClient } from '@/lib/db/prisma-client';

export async function logTenantActivity(
  tenantId: string,
  userId: string,
  action: string,
  details: any
) {
  const prisma = getPrismaClient(tenantId);
  
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      details: JSON.stringify(details),
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      timestamp: new Date(),
    },
  });
}

// Usage
await logTenantActivity(tenantId, userId, 'STUDENT_CREATED', {
  studentId: student.id,
  ipAddress: request.ip,
  userAgent: request.headers.get('user-agent'),
});
```

### 5. Backup Strategy

```typescript
// scripts/backup-tenant.ts
import { execSync } from 'child_process';
import { getTenantConfig } from '@/lib/db/tenant-config';
import { uploadToS3 } from '@/lib/storage/s3';

async function backupTenant(tenantId: string) {
  const config = getTenantConfig(tenantId);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `backup-${tenantId}-${timestamp}.sql`;

  // Create database dump
  execSync(
    `pg_dump ${config.databaseUrl} > /tmp/${backupFile}`,
    { stdio: 'inherit' }
  );

  // Upload to S3 or cloud storage
  await uploadToS3(`/tmp/${backupFile}`, `backups/${tenantId}/${backupFile}`);

  console.log(`✓ Backup completed for ${tenantId}`);
}

// Schedule daily backups
import cron from 'node-cron';

cron.schedule('0 2 * * *', async () => {
  const tenants = getAllTenants();
  for (const tenant of tenants) {
    await backupTenant(tenant.tenantId);
  }
});
```


---

## Migration Guide

### Migrating from Single-Tenant to Multi-Tenant

#### Step 1: Backup Current Database

```bash
pg_dump your_current_db > backup-before-migration.sql
```

#### Step 2: Create Master Database

```sql
-- Create master database
CREATE DATABASE school_erp_master;

-- Create tenant table
CREATE TABLE tenants (
  id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(255) UNIQUE,
  custom_domain VARCHAR(255) UNIQUE,
  database_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Step 3: Create Tenant Databases

```bash
# For each existing school
createdb school_a_db
createdb school_b_db

# Restore data to tenant databases
psql school_a_db < backup-before-migration.sql
```

#### Step 4: Update Application Code

1. Add middleware for tenant resolution
2. Update database client to use tenant-specific connections
3. Update all API routes to use tenant context
4. Update file upload to use tenant-specific storage

#### Step 5: Test Migration

```typescript
// scripts/test-migration.ts
import { getPrismaClient } from '@/lib/db/prisma-client';

async function testTenantAccess(tenantId: string) {
  console.log(`Testing tenant: ${tenantId}`);
  
  const prisma = getPrismaClient(tenantId);
  
  // Test queries
  const userCount = await prisma.user.count();
  const studentCount = await prisma.student.count();
  const teacherCount = await prisma.teacher.count();
  
  console.log(`Users: ${userCount}`);
  console.log(`Students: ${studentCount}`);
  console.log(`Teachers: ${teacherCount}`);
  
  await prisma.$disconnect();
}

// Test all tenants
const tenants = ['school_a', 'school_b'];
for (const tenant of tenants) {
  await testTenantAccess(tenant);
}
```

### DNS Configuration

#### For Subdomains

Add wildcard DNS record:
```
*.yourerp.com  A  your-server-ip
```

Or individual records:
```
schoola.yourerp.com  A  your-server-ip
schoolb.yourerp.com  A  your-server-ip
```

#### For Custom Domains

Each school configures their DNS:
```
erp.schoola.edu  CNAME  yourerp.com
```

---

## Mobile App Integration

### Tenant Selection in Mobile App

```typescript
// src/screens/auth/TenantSelectionScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TenantSelectionScreen({ navigation }) {
  const [subdomain, setSubdomain] = useState('');

  const handleContinue = async () => {
    // Verify tenant exists
    const response = await fetch(
      `https://api.yourerp.com/public/verify-tenant?subdomain=${subdomain}`
    );
    
    if (response.ok) {
      // Save tenant info
      await AsyncStorage.setItem('tenant_id', subdomain);
      await AsyncStorage.setItem(
        'api_base_url',
        `https://${subdomain}.yourerp.com/api`
      );
      
      navigation.navigate('Login');
    } else {
      alert('School not found');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Enter your school code"
        value={subdomain}
        onChangeText={setSubdomain}
      />
      <Button title="Continue" onPress={handleContinue} />
    </View>
  );
}
```

### Dynamic API Client

```typescript
// src/api/client.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getApiClient() {
  const baseURL = await AsyncStorage.getItem('api_base_url');
  const token = await AsyncStorage.getItem('clerk_token');

  return axios.create({
    baseURL: baseURL || 'https://api.yourerp.com',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Usage
const client = await getApiClient();
const response = await client.get('/student/dashboard');
```


---

## Performance Optimization

### 1. Connection Pooling

```typescript
// lib/db/connection-pool.ts
import { PrismaClient } from '@prisma/client';

const MAX_CONNECTIONS_PER_TENANT = 10;

class TenantConnectionPool {
  private pools: Map<string, PrismaClient[]> = new Map();
  private activeConnections: Map<string, number> = new Map();

  getConnection(tenantId: string, databaseUrl: string): PrismaClient {
    if (!this.pools.has(tenantId)) {
      this.pools.set(tenantId, []);
      this.activeConnections.set(tenantId, 0);
    }

    const pool = this.pools.get(tenantId)!;
    const active = this.activeConnections.get(tenantId)!;

    // Reuse existing connection if available
    if (pool.length > 0) {
      return pool.pop()!;
    }

    // Create new connection if under limit
    if (active < MAX_CONNECTIONS_PER_TENANT) {
      this.activeConnections.set(tenantId, active + 1);
      return new PrismaClient({
        datasources: { db: { url: databaseUrl } },
      });
    }

    // Wait for available connection
    throw new Error('Connection pool exhausted');
  }

  releaseConnection(tenantId: string, client: PrismaClient) {
    const pool = this.pools.get(tenantId);
    if (pool) {
      pool.push(client);
    }
  }
}

export const connectionPool = new TenantConnectionPool();
```

### 2. Caching Strategy

```typescript
// lib/cache/tenant-cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function getCachedData<T>(
  tenantId: string,
  key: string
): Promise<T | null> {
  const cacheKey = `${tenantId}:${key}`;
  const cached = await redis.get(cacheKey);
  return cached as T | null;
}

export async function setCachedData(
  tenantId: string,
  key: string,
  data: any,
  ttl: number = 300 // 5 minutes
) {
  const cacheKey = `${tenantId}:${key}`;
  await redis.setex(cacheKey, ttl, JSON.stringify(data));
}

export async function invalidateCache(tenantId: string, pattern: string) {
  const keys = await redis.keys(`${tenantId}:${pattern}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Usage in API route
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!;
  
  // Try cache first
  const cached = await getCachedData(tenantId, 'dashboard');
  if (cached) {
    return NextResponse.json({ success: true, data: cached });
  }
  
  // Fetch from database
  const prisma = getPrismaClient(tenantId);
  const data = await prisma.student.findMany();
  
  // Cache the result
  await setCachedData(tenantId, 'dashboard', data);
  
  return NextResponse.json({ success: true, data });
}
```

### 3. Query Optimization

```typescript
// lib/db/optimized-queries.ts
export async function getStudentDashboard(
  tenantId: string,
  studentId: string
) {
  const prisma = getPrismaClient(tenantId);

  // Use parallel queries
  const [student, attendance, assignments, exams] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    
    prisma.studentAttendance.aggregate({
      where: {
        studentId,
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _count: {
        status: true,
      },
    }),
    
    prisma.assignment.findMany({
      where: {
        submissions: {
          none: {
            studentId,
          },
        },
        dueDate: {
          gte: new Date(),
        },
      },
      take: 5,
      orderBy: {
        dueDate: 'asc',
      },
    }),
    
    prisma.exam.findMany({
      where: {
        examDate: {
          gte: new Date(),
        },
      },
      take: 5,
      orderBy: {
        examDate: 'asc',
      },
    }),
  ]);

  return { student, attendance, assignments, exams };
}
```

---

## Monitoring and Analytics

### Tenant-Specific Monitoring

```typescript
// lib/monitoring/tenant-metrics.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function trackTenantMetric(
  tenantId: string,
  metric: string,
  value: number = 1
) {
  const key = `metrics:${tenantId}:${metric}:${new Date().toISOString().split('T')[0]}`;
  await redis.incrby(key, value);
  await redis.expire(key, 86400 * 30); // Keep for 30 days
}

export async function getTenantMetrics(tenantId: string, metric: string) {
  const pattern = `metrics:${tenantId}:${metric}:*`;
  const keys = await redis.keys(pattern);
  
  const metrics: Record<string, number> = {};
  for (const key of keys) {
    const value = await redis.get(key);
    const date = key.split(':').pop()!;
    metrics[date] = Number(value);
  }
  
  return metrics;
}

// Track API usage
export async function trackApiCall(tenantId: string, endpoint: string) {
  await trackTenantMetric(tenantId, `api:${endpoint}`);
  await trackTenantMetric(tenantId, 'api:total');
}

// Track storage usage
export async function trackStorageUsage(tenantId: string, bytes: number) {
  await trackTenantMetric(tenantId, 'storage:bytes', bytes);
}
```

### Usage Dashboard

```typescript
// app/api/admin/tenant-analytics/route.ts
export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get('tenantId');
  
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
  }

  const [apiCalls, storageUsage, activeUsers] = await Promise.all([
    getTenantMetrics(tenantId, 'api:total'),
    getTenantMetrics(tenantId, 'storage:bytes'),
    getActiveUsers(tenantId),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      apiCalls,
      storageUsage,
      activeUsers,
    },
  });
}
```

---

## Best Practices

### 1. Always Verify Tenant Context
```typescript
// Every API route should verify tenant
const tenantId = request.headers.get('x-tenant-id');
if (!tenantId) {
  throw new Error('Tenant context missing');
}
```

### 2. Use Tenant-Specific Logging
```typescript
console.log(`[${tenantId}] User ${userId} performed action`);
```

### 3. Implement Tenant Quotas
```typescript
export async function checkTenantQuota(tenantId: string, resource: string) {
  const tenant = await getTenantConfig(tenantId);
  const usage = await getResourceUsage(tenantId, resource);
  
  if (usage >= tenant.limits[resource]) {
    throw new Error(`Quota exceeded for ${resource}`);
  }
}
```

### 4. Regular Backups
- Automated daily backups per tenant
- Store backups in separate locations
- Test restore procedures regularly

### 5. Monitor Performance
- Track query performance per tenant
- Monitor connection pool usage
- Alert on anomalies

---

## Troubleshooting

### Issue: Connection Pool Exhausted
**Solution**: Increase pool size or implement connection queuing

### Issue: Slow Queries
**Solution**: Add database indexes, implement caching

### Issue: Tenant Data Leakage
**Solution**: Audit all queries, add tenant verification middleware

### Issue: Migration Failures
**Solution**: Test migrations on staging, implement rollback procedures

---

## Conclusion

This multi-tenant architecture provides:
- ✅ Complete data isolation per school
- ✅ Scalable infrastructure
- ✅ Easy onboarding of new schools
- ✅ Flexible customization per tenant
- ✅ Secure and compliant data handling
- ✅ Cost-effective resource utilization

For questions or support, contact: support@yourerp.com

