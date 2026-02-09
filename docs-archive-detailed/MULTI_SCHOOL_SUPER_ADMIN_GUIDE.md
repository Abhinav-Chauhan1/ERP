# Multi-School & Super Admin Implementation Guide

## Overview
This guide will help you transform your single-school ERP system into a multi-tenant system supporting multiple schools with a super admin role.

## Architecture Changes

### 1. Database Schema Changes

#### New Models to Add

**School Model** - Central entity for multi-tenancy
```prisma
model School {
  id              String   @id @default(cuid())
  name            String
  code            String   @unique  // Unique school identifier
  email           String?
  phone           String?
  address         String?
  website         String?
  logo            String?
  timezone        String   @default("UTC")
  
  // Subscription & Status
  subscriptionPlan    SubscriptionPlan @default(BASIC)
  subscriptionStatus  SubscriptionStatus @default(ACTIVE)
  subscriptionStart   DateTime @default(now())
  subscriptionEnd     DateTime?
  maxStudents         Int      @default(500)
  maxTeachers         Int      @default(50)
  
  // Settings
  settings        SchoolSettings?
  
  // Relationships - All major entities will belong to a school
  users           User[]
  academicYears   AcademicYear[]
  departments     Department[]
  classes         Class[]
  subjects        Subject[]
  feeTypes        FeeType[]
  scholarships    Scholarship[]
  events          Event[]
  announcements   Announcement[]
  documentTypes   DocumentType[]
  examTypes       ExamType[]
  gradeScales     GradeScale[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([code])
  @@index([subscriptionStatus])
}

enum SubscriptionPlan {
  BASIC
  STANDARD
  PREMIUM
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  SUSPENDED
  EXPIRED
  TRIAL
}

model SchoolSettings {
  id                    String   @id @default(cuid())
  school                School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  schoolId              String   @unique
  
  // Academic Settings
  currentAcademicYear   String?
  currentTerm           String?
  gradingSystem         String   @default("percentage")
  passingGrade          Int      @default(50)
  autoAttendance        Boolean  @default(false)
  lateArrivalThreshold  Int      @default(15)
  
  // Notification Settings
  emailNotifications    Boolean  @default(true)
  smsNotifications      Boolean  @default(false)
  pushNotifications     Boolean  @default(true)
  
  // Security Settings
  twoFactorAuth         Boolean  @default(false)
  sessionTimeout        Int      @default(30)
  passwordExpiry        Int      @default(90)
  
  // Appearance Settings
  theme                 String   @default("light")
  primaryColor          String   @default("#3b82f6")
  language              String   @default("en")
  dateFormat            String   @default("mdy")
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

#### Update User Model
```prisma
model User {
  id            String    @id @default(cuid())
  clerkId       String    @unique
  email         String    @unique
  firstName     String
  lastName      String
  phone         String?
  avatar        String?
  role          UserRole  @default(STUDENT)
  active        Boolean   @default(true)
  
  // Multi-school support
  school        School?   @relation(fields: [schoolId], references: [id])
  schoolId      String?   // Null for SUPER_ADMIN
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Role-based relationships
  teacher       Teacher?
  student       Student?
  parent        Parent?
  administrator Administrator?
  superAdmin    SuperAdmin?  // New relationship

  // Common relationships
  sentMessages      Message[]        @relation("SentMessages")
  receivedMessages  Message[]        @relation("ReceivedMessages")
  notifications     Notification[]
  documents         Document[]
  
  @@index([schoolId])
  @@index([role])
}

enum UserRole {
  SUPER_ADMIN  // New role - can manage all schools
  ADMIN        // School-level admin
  TEACHER
  STUDENT
  PARENT
}

model SuperAdmin {
  id              String   @id @default(cuid())
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId          String   @unique
  position        String?
  permissions     String[] // Array of permission strings
  canCreateSchools Boolean @default(true)
  canManageSubscriptions Boolean @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### Update All Major Models
Add `schoolId` to these models:
- AcademicYear
- Department
- Class
- Subject
- FeeType
- Scholarship
- Event
- Announcement
- DocumentType
- ExamType
- GradeScale
- Timetable
- TimetableConfig

Example for AcademicYear:
```prisma
model AcademicYear {
  id          String   @id @default(cuid())
  school      School   @relation(fields: [schoolId], references: [id])
  schoolId    String
  name        String
  startDate   DateTime
  endDate     DateTime
  isCurrent   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  terms       Term[]
  classes     Class[]
  feeStructures FeeStructure[]
  budgets     Budget[]
  
  @@index([schoolId])
  @@index([schoolId, isCurrent])
}
```

### 2. Migration Strategy

#### Step 1: Create Migration File
```bash
npx prisma migrate dev --name add_multi_school_support --create-only
```

#### Step 2: Edit Migration SQL
Before running the migration, you'll need to:

1. Add School table
2. Add SuperAdmin table
3. Add schoolId to User and other tables
4. Create a default school for existing data
5. Migrate existing data to the default school

Example migration SQL:
```sql
-- Create School table
CREATE TABLE "School" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL UNIQUE,
  -- ... other fields
);

-- Create default school for existing data
INSERT INTO "School" ("id", "name", "code", "subscriptionPlan", "subscriptionStatus")
VALUES ('default-school-id', 'Default School', 'DEFAULT', 'PREMIUM', 'ACTIVE');

-- Add schoolId to User table
ALTER TABLE "User" ADD COLUMN "schoolId" TEXT;

-- Update existing users to belong to default school
UPDATE "User" SET "schoolId" = 'default-school-id' WHERE "role" != 'SUPER_ADMIN';

-- Add foreign key constraint
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" 
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL;

-- Repeat for all other tables that need schoolId
```

#### Step 3: Run Migration
```bash
npx prisma migrate dev
npx prisma generate
```

### 3. Middleware Updates

Update `src/middleware.ts` to handle school context:

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

const superAdminRoutes = createRouteMatcher(["/super-admin(.*)"]);
const adminRoutes = createRouteMatcher(["/admin(.*)"]);
const teacherRoutes = createRouteMatcher(["/teacher(.*)", "/shared(.*)"]);
const studentRoutes = createRouteMatcher(["/student(.*)", "/shared(.*)"]);
const parentRoutes = createRouteMatcher(["/parent(.*)", "/shared(.*)"]);
const publicRoutes = createRouteMatcher([
  "/", 
  "/login(.*)",
  "/register(.*)",
  "/forgot-password(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/users/sync(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  if (publicRoutes(req)) {
    return NextResponse.next();
  }

  const authObject = await auth();
  
  if (!authObject.userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  const role = (authObject.sessionClaims?.metadata as { role?: string })?.role;
  const schoolId = (authObject.sessionClaims?.metadata as { schoolId?: string })?.schoolId;

  // Super Admin access control
  if (role === UserRole.SUPER_ADMIN) {
    // Super admins can access everything
    return NextResponse.next();
  }
  
  // Ensure non-super-admin users have a school
  if (!schoolId && role !== UserRole.SUPER_ADMIN) {
    return NextResponse.redirect(new URL("/no-school", req.url));
  }

  // Role-based access control
  if (role === UserRole.ADMIN) {
    if (superAdminRoutes(req)) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  } else if (role === UserRole.TEACHER) {
    if (adminRoutes(req) || superAdminRoutes(req)) {
      return NextResponse.redirect(new URL("/teacher", req.url));
    }
  } else if (role === UserRole.STUDENT) {
    if (adminRoutes(req) || teacherRoutes(req) || superAdminRoutes(req)) {
      return NextResponse.redirect(new URL("/student", req.url));
    }
  } else if (role === UserRole.PARENT) {
    if (adminRoutes(req) || teacherRoutes(req) || studentRoutes(req) || superAdminRoutes(req)) {
      return NextResponse.redirect(new URL("/parent", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### 4. Utility Functions

Create `src/lib/utils/school-context.ts`:

```typescript
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function getSchoolContext() {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const schoolId = (sessionClaims?.metadata as { schoolId?: string })?.schoolId;

  return {
    userId,
    role: role as UserRole,
    schoolId,
    isSuperAdmin: role === UserRole.SUPER_ADMIN,
  };
}

export async function requireSchoolContext() {
  const context = await getSchoolContext();
  
  if (!context.isSuperAdmin && !context.schoolId) {
    throw new Error("No school context available");
  }

  return context;
}

export async function getSchoolData(schoolId: string) {
  return await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      settings: true,
    },
  });
}

// Middleware for API routes
export function withSchoolContext(handler: Function) {
  return async (req: Request, context: any) => {
    const schoolContext = await requireSchoolContext();
    return handler(req, { ...context, schoolContext });
  };
}
```

### 5. Update All Database Queries

All queries must now filter by schoolId. Example:

**Before:**
```typescript
const students = await prisma.student.findMany({
  include: { user: true }
});
```

**After:**
```typescript
const { schoolId, isSuperAdmin } = await getSchoolContext();

const students = await prisma.student.findMany({
  where: isSuperAdmin ? {} : {
    user: { schoolId }
  },
  include: { user: true }
});
```

### 6. Super Admin Dashboard

Create `src/app/super-admin/page.tsx`:

```typescript
import { requireSchoolContext } from "@/lib/utils/school-context";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminDashboard() {
  const { isSuperAdmin } = await requireSchoolContext();
  
  if (!isSuperAdmin) {
    redirect("/");
  }

  const schools = await prisma.school.findMany({
    include: {
      _count: {
        select: {
          users: true,
          academicYears: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const stats = {
    totalSchools: schools.length,
    activeSchools: schools.filter(s => s.subscriptionStatus === 'ACTIVE').length,
    totalUsers: schools.reduce((sum, s) => sum + s._count.users, 0),
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Super Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Schools" value={stats.totalSchools} />
        <StatCard title="Active Schools" value={stats.activeSchools} />
        <StatCard title="Total Users" value={stats.totalUsers} />
      </div>

      {/* Schools List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Schools</h2>
          <SchoolsTable schools={schools} />
        </div>
      </div>
    </div>
  );
}
```

### 7. School Management Features

Create school management actions in `src/lib/actions/schoolActions.ts`:

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { requireSchoolContext } from "@/lib/utils/school-context";
import { revalidatePath } from "next/cache";

export async function createSchool(data: {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionPlan: string;
  maxStudents: number;
  maxTeachers: number;
}) {
  const { isSuperAdmin } = await requireSchoolContext();
  
  if (!isSuperAdmin) {
    throw new Error("Unauthorized");
  }

  const school = await prisma.school.create({
    data: {
      ...data,
      subscriptionStatus: 'TRIAL',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
    },
  });

  revalidatePath("/super-admin/schools");
  return school;
}

export async function updateSchool(schoolId: string, data: any) {
  const { isSuperAdmin } = await requireSchoolContext();
  
  if (!isSuperAdmin) {
    throw new Error("Unauthorized");
  }

  const school = await prisma.school.update({
    where: { id: schoolId },
    data,
  });

  revalidatePath("/super-admin/schools");
  return school;
}

export async function suspendSchool(schoolId: string) {
  const { isSuperAdmin } = await requireSchoolContext();
  
  if (!isSuperAdmin) {
    throw new Error("Unauthorized");
  }

  await prisma.school.update({
    where: { id: schoolId },
    data: { subscriptionStatus: 'SUSPENDED' },
  });

  revalidatePath("/super-admin/schools");
}

export async function getSchoolStats(schoolId: string) {
  const { isSuperAdmin } = await requireSchoolContext();
  
  if (!isSuperAdmin) {
    throw new Error("Unauthorized");
  }

  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalClasses,
  ] = await Promise.all([
    prisma.user.count({ where: { schoolId } }),
    prisma.student.count({ where: { user: { schoolId } } }),
    prisma.teacher.count({ where: { user: { schoolId } } }),
    prisma.class.count({ where: { schoolId } }),
  ]);

  return {
    totalUsers,
    totalStudents,
    totalTeachers,
    totalClasses,
  };
}
```

### 8. Update Clerk Webhook

Update webhook to handle schoolId in `src/app/api/webhooks/clerk/route.ts`:

```typescript
// When creating a user, assign them to a school
const user = await prisma.user.create({
  data: {
    clerkId: evt.data.id,
    email: evt.data.email_addresses[0].email_address,
    firstName: evt.data.first_name || "",
    lastName: evt.data.last_name || "",
    role: metadata.role || "STUDENT",
    schoolId: metadata.schoolId, // Get from metadata
    // ... other fields
  },
});
```

### 9. School Selector Component

For super admins, create a school selector:

```typescript
// src/components/school-selector.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SchoolSelector({ schools, currentSchoolId }: any) {
  const router = useRouter();
  const [selectedSchool, setSelectedSchool] = useState(currentSchoolId);

  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchool(schoolId);
    // Store in session or cookie
    document.cookie = `selected-school=${schoolId}; path=/`;
    router.refresh();
  };

  return (
    <select 
      value={selectedSchool} 
      onChange={(e) => handleSchoolChange(e.target.value)}
      className="border rounded px-3 py-2"
    >
      <option value="">All Schools</option>
      {schools.map((school: any) => (
        <option key={school.id} value={school.id}>
          {school.name}
        </option>
      ))}
    </select>
  );
}
```

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Add School model to schema
- [ ] Add SuperAdmin model to schema
- [ ] Update UserRole enum with SUPER_ADMIN
- [ ] Add schoolId to User model
- [ ] Add schoolId to all major models
- [ ] Create and run migration
- [ ] Create default school for existing data
- [ ] Update seed files

### Phase 2: Core Infrastructure
- [ ] Create school-context utility functions
- [ ] Update middleware for super admin routes
- [ ] Update Clerk webhook to handle schoolId
- [ ] Create school management actions
- [ ] Update all existing actions to filter by schoolId

### Phase 3: UI Development
- [ ] Create super admin dashboard
- [ ] Create school management pages
- [ ] Create school selector component
- [ ] Update navigation for super admin
- [ ] Create school settings pages

### Phase 4: Testing & Migration
- [ ] Test super admin access
- [ ] Test school isolation (data from one school shouldn't leak to another)
- [ ] Test existing functionality with school context
- [ ] Migrate existing data to default school
- [ ] Create first super admin user

### Phase 5: Documentation
- [ ] Document multi-school architecture
- [ ] Create admin guide for managing schools
- [ ] Update API documentation
- [ ] Create deployment guide

## Key Considerations

### Data Isolation
- Every query must filter by schoolId (except for super admin)
- Use Prisma middleware to automatically add schoolId filter
- Implement row-level security in database if using PostgreSQL

### Performance
- Add indexes on schoolId columns
- Consider database sharding for large deployments
- Implement caching per school

### Security
- Validate schoolId in all API routes
- Prevent cross-school data access
- Implement audit logging for super admin actions

### Scalability
- Consider separate databases per school for large deployments
- Implement connection pooling
- Use Redis for session management across schools

## Next Steps

1. Review this guide with your team
2. Decide on migration strategy (big bang vs gradual)
3. Set up development environment for testing
4. Create backup of production database
5. Start with Phase 1 implementation

Would you like me to help you implement any specific part of this guide?
