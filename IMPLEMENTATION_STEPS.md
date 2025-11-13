# Step-by-Step Implementation Guide

## Quick Start: Adding Multi-School Support

### Step 1: Backup Everything
```bash
# Backup your database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Backup your schema
cp prisma/schema.prisma prisma/schema.backup.prisma

# Commit all changes
git add .
git commit -m "Backup before multi-school implementation"
```

### Step 2: Update Schema

1. Open `prisma/schema.prisma`
2. Add the School model (see MULTI_SCHOOL_SUPER_ADMIN_GUIDE.md)
3. Add SuperAdmin model
4. Update UserRole enum to include SUPER_ADMIN
5. Add schoolId to User model
6. Add schoolId to these models:
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

### Step 3: Create Migration

```bash
# Create migration file (don't run yet)
npx prisma migrate dev --name add_multi_school_support --create-only
```

### Step 4: Edit Migration SQL

Edit the generated migration file in `prisma/migrations/` to:
1. Create School table
2. Insert a default school
3. Add schoolId columns
4. Update existing data to use default school
5. Add foreign key constraints

### Step 5: Run Migration

```bash
npx prisma migrate dev
npx prisma generate
```

### Step 6: Update Code

1. Update middleware (src/middleware.ts)
2. Create school-context utility
3. Update all database queries to filter by schoolId
4. Create super admin dashboard
5. Update Clerk webhook

### Step 7: Create First Super Admin

Run a script or manually update database:
```sql
-- Create super admin user
UPDATE "User" SET role = 'SUPER_ADMIN', "schoolId" = NULL 
WHERE email = 'your-admin@email.com';

-- Create super admin profile
INSERT INTO "SuperAdmin" ("id", "userId", "canCreateSchools", "canManageSubscriptions")
VALUES (gen_random_uuid(), 'user-id-here', true, true);
```

### Step 8: Test

1. Login as super admin
2. Create a new school
3. Create users for that school
4. Verify data isolation between schools

## Need Help?

Refer to MULTI_SCHOOL_SUPER_ADMIN_GUIDE.md for detailed implementation.
