# Enhanced Syllabus Scope System - Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from the legacy syllabus system to the Enhanced Syllabus Scope System. The migration preserves all existing data while adding new capabilities.

## Table of Contents

- [Pre-Migration Checklist](#pre-migration-checklist)
- [Understanding the Changes](#understanding-the-changes)
- [Migration Process](#migration-process)
- [Post-Migration Verification](#post-migration-verification)
- [Rollback Procedure](#rollback-procedure)
- [FAQ](#faq)

---

## Pre-Migration Checklist

### Before You Begin

Complete these steps before starting the migration:

- [ ] **Backup Database**: Create a full database backup
- [ ] **Review Current Data**: Document existing syllabi count and structure
- [ ] **Test Environment**: Run migration in test environment first
- [ ] **Notify Users**: Inform users of scheduled maintenance
- [ ] **Schedule Downtime**: Plan migration during low-usage period
- [ ] **Verify Dependencies**: Ensure all related systems are compatible
- [ ] **Review Documentation**: Read this guide completely

### System Requirements

- PostgreSQL 12 or higher
- Prisma ORM 5.x or higher
- Node.js 18 or higher
- Sufficient database storage (estimate 20% increase)

### Backup Procedure

```bash
# Create database backup
pg_dump -U username -d database_name -F c -b -v -f backup_$(date +%Y%m%d_%H%M%S).dump

# Verify backup
pg_restore --list backup_YYYYMMDD_HHMMSS.dump
```

---

## Understanding the Changes

### Schema Changes

The migration adds the following fields to the `Syllabus` table:

#### New Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `academicYearId` | String? | null | Link to academic year |
| `classId` | String? | null | Link to class (for class-wide/section-specific) |
| `sectionId` | String? | null | Link to section (for section-specific) |
| `curriculumType` | Enum | GENERAL | Type of curriculum |
| `boardType` | String? | null | Educational board |
| `status` | Enum | PUBLISHED* | Lifecycle status |
| `isActive` | Boolean | true | Soft delete flag |
| `effectiveFrom` | DateTime? | null | Activation date |
| `effectiveTo` | DateTime? | null | Expiration date |
| `version` | String | "1.0" | Version number |
| `parentSyllabusId` | String? | null | Parent version reference |
| `createdBy` | String | "" | Creator user ID |
| `updatedBy` | String? | null | Last modifier user ID |
| `approvedBy` | String? | null | Approver user ID |
| `approvedAt` | DateTime? | null | Approval timestamp |
| `tags` | String[] | [] | Searchable tags |
| `difficultyLevel` | Enum | INTERMEDIATE | Difficulty classification |
| `estimatedHours` | Int? | null | Total curriculum hours |
| `prerequisites` | String? | null | Required prior knowledge |

*Note: Existing syllabi default to PUBLISHED for backward compatibility

#### New Enums

```prisma
enum SyllabusStatus {
  DRAFT
  PENDING_REVIEW
  APPROVED
  PUBLISHED
  ARCHIVED
  DEPRECATED
}

enum CurriculumType {
  GENERAL
  ADVANCED
  REMEDIAL
  INTEGRATED
  VOCATIONAL
  SPECIAL_NEEDS
}

enum DifficultyLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}
```

#### New Indexes

```prisma
@@unique([subjectId, academicYearId, classId, sectionId, curriculumType])
@@index([subjectId, classId])
@@index([academicYearId, isActive])
@@index([status, isActive])
@@index([curriculumType, boardType])
```

#### New Relationships

```prisma
// Syllabus model
academicYear   AcademicYear? @relation(fields: [academicYearId], references: [id])
class          Class?        @relation(fields: [classId], references: [id])
section        ClassSection? @relation(fields: [sectionId], references: [id])
parentSyllabus Syllabus?     @relation("SyllabusVersions", fields: [parentSyllabusId], references: [id])
childVersions  Syllabus[]    @relation("SyllabusVersions")

// Related models
model AcademicYear {
  syllabi Syllabus[]
}

model Class {
  syllabi Syllabus[]
}

model ClassSection {
  syllabi Syllabus[]
}
```

### Behavioral Changes

#### Before Migration

- One syllabus per subject (enforced constraint)
- No scope differentiation
- No lifecycle management
- No versioning support
- Limited metadata

#### After Migration

- Multiple syllabi per subject (different scopes)
- Three scope levels: subject-wide, class-wide, section-specific
- Full lifecycle management (draft → published → archived)
- Version tracking with parent-child relationships
- Rich metadata (tags, difficulty, hours, prerequisites)
- Automatic fallback logic for syllabus retrieval

### Data Preservation

**All existing data is preserved:**
- ✅ Syllabus titles and descriptions
- ✅ Subject relationships
- ✅ Document URLs
- ✅ Units and modules
- ✅ Creation and update timestamps
- ✅ All existing relationships

**New defaults for existing syllabi:**
- Scope: Subject-wide (null classId, null sectionId)
- Status: PUBLISHED (visible to all users)
- Curriculum Type: GENERAL
- Difficulty Level: INTERMEDIATE
- Version: "1.0"
- isActive: true

---

## Migration Process

### Step 1: Prepare Migration

1. **Stop Application Services**
   ```bash
   # Stop your application
   pm2 stop all
   # or
   systemctl stop your-app-service
   ```

2. **Create Database Backup**
   ```bash
   pg_dump -U username -d database_name -F c -b -v -f pre_migration_backup.dump
   ```

3. **Verify Backup**
   ```bash
   pg_restore --list pre_migration_backup.dump | head -20
   ```

### Step 2: Run Prisma Migration

1. **Generate Migration File**
   ```bash
   npx prisma migrate dev --name add_enhanced_syllabus_scope_fields --create-only
   ```

2. **Review Migration SQL**
   ```bash
   # Check the generated migration file
   cat prisma/migrations/YYYYMMDD_add_enhanced_syllabus_scope_fields/migration.sql
   ```

3. **Apply Migration**
   ```bash
   # For production
   npx prisma migrate deploy

   # For development
   npx prisma migrate dev
   ```

### Step 3: Verify Migration

1. **Check Schema**
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

2. **Verify Data**
   ```sql
   -- Check existing syllabi have defaults
   SELECT 
     id, 
     title, 
     status, 
     curriculumType, 
     isActive,
     classId,
     sectionId
   FROM "Syllabus"
   LIMIT 10;
   ```

3. **Verify Indexes**
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'Syllabus';
   ```

### Step 4: Update Application Code

1. **Update Imports**
   ```typescript
   // Update Zod schemas
   import { syllabusFormSchema } from '@/lib/validations/syllabusSchemaValidations';
   
   // Update server actions
   import { 
     createSyllabus,
     getSyllabusWithFallback,
     getSyllabusByScope 
   } from '@/app/actions/syllabusActions';
   ```

2. **Update UI Components**
   - Replace old syllabus forms with new scope-aware forms
   - Update syllabus list to show scope information
   - Add filtering controls

3. **Update API Calls**
   ```typescript
   // Old way
   const syllabus = await getSyllabusBySubject(subjectId);
   
   // New way with fallback
   const syllabus = await getSyllabusWithFallback({
     subjectId,
     academicYearId,
     classId,
     sectionId,
     curriculumType: 'GENERAL'
   });
   ```

### Step 5: Data Enrichment (Optional)

After migration, you can enrich existing syllabi with new metadata:

```sql
-- Add academic year to existing syllabi
UPDATE "Syllabus" s
SET "academicYearId" = ay.id
FROM "AcademicYear" ay
WHERE ay."isCurrent" = true
AND s."academicYearId" IS NULL;

-- Add tags based on subject
UPDATE "Syllabus" s
SET tags = ARRAY[sub.name, sub.code]
FROM "Subject" sub
WHERE s."subjectId" = sub.id
AND s.tags = '{}';

-- Set createdBy for existing syllabi (if you have audit logs)
UPDATE "Syllabus" s
SET "createdBy" = 'system-migration'
WHERE "createdBy" = '';
```

### Step 6: Restart Application

1. **Start Services**
   ```bash
   pm2 start all
   # or
   systemctl start your-app-service
   ```

2. **Monitor Logs**
   ```bash
   pm2 logs
   # or
   journalctl -u your-app-service -f
   ```

3. **Check Health**
   ```bash
   curl http://localhost:3000/api/health
   ```

---

## Post-Migration Verification

### Verification Checklist

- [ ] All existing syllabi are visible
- [ ] Syllabus details pages load correctly
- [ ] Can create new syllabi with scope selection
- [ ] Filtering works correctly
- [ ] Fallback logic returns correct syllabi
- [ ] Status changes work
- [ ] Cloning works
- [ ] Document uploads work
- [ ] Units and modules are intact
- [ ] No console errors

### Test Scenarios

#### Test 1: View Existing Syllabi

1. Navigate to syllabus list
2. Verify all existing syllabi appear
3. Check that scope shows as "Subject-Wide"
4. Verify status shows as "Published"

#### Test 2: Create Subject-Wide Syllabus

1. Click "Create New Syllabus"
2. Select "Subject-Wide" scope
3. Fill in required fields
4. Save and verify creation

#### Test 3: Create Class-Wide Syllabus

1. Click "Create New Syllabus"
2. Select "Class-Wide" scope
3. Choose class from dropdown
4. Save and verify creation

#### Test 4: Create Section-Specific Syllabus

1. Click "Create New Syllabus"
2. Select "Section-Specific" scope
3. Choose class and section
4. Save and verify creation

#### Test 5: Test Fallback Logic

1. Create syllabi at multiple scope levels for same subject
2. Query as student in specific section
3. Verify most specific syllabus is returned

#### Test 6: Test Filtering

1. Apply subject filter
2. Apply class filter
3. Apply status filter
4. Verify results match filters

#### Test 7: Test Cloning

1. Open existing syllabus
2. Click "Clone"
3. Modify scope
4. Verify clone created correctly

### Performance Verification

```sql
-- Check query performance with new indexes
EXPLAIN ANALYZE
SELECT * FROM "Syllabus"
WHERE "subjectId" = 'some-id'
AND "classId" = 'some-class-id'
AND "status" = 'PUBLISHED'
AND "isActive" = true;

-- Should use indexes efficiently
```

### Data Integrity Checks

```sql
-- Verify no orphaned relationships
SELECT COUNT(*) FROM "Syllabus" s
LEFT JOIN "Subject" sub ON s."subjectId" = sub.id
WHERE sub.id IS NULL;

-- Should return 0

-- Verify unique constraint
SELECT 
  "subjectId", 
  "academicYearId", 
  "classId", 
  "sectionId", 
  "curriculumType",
  COUNT(*)
FROM "Syllabus"
GROUP BY "subjectId", "academicYearId", "classId", "sectionId", "curriculumType"
HAVING COUNT(*) > 1;

-- Should return 0 rows
```

---

## Rollback Procedure

If issues arise, follow this rollback procedure:

### Step 1: Stop Application

```bash
pm2 stop all
```

### Step 2: Restore Database

```bash
# Drop current database (CAUTION!)
dropdb database_name

# Create new database
createdb database_name

# Restore from backup
pg_restore -U username -d database_name -v pre_migration_backup.dump
```

### Step 3: Revert Code Changes

```bash
# Revert to previous commit
git revert HEAD

# Or checkout previous version
git checkout previous-version-tag
```

### Step 4: Restart Application

```bash
pm2 start all
```

### Step 5: Verify Rollback

- Check that old system is working
- Verify all data is intact
- Test critical functionality

---

## FAQ

### Q: Will existing syllabi still work after migration?

**A:** Yes, all existing syllabi are preserved and will work exactly as before. They are treated as subject-wide syllabi with PUBLISHED status.

### Q: Do I need to update all existing syllabi immediately?

**A:** No, existing syllabi will continue to work with default values. You can gradually enrich them with new metadata over time.

### Q: What happens to the "one syllabus per subject" constraint?

**A:** This constraint is removed. You can now create multiple syllabi per subject with different scopes, curriculum types, or academic years.

### Q: Will students see different syllabi after migration?

**A:** Initially, no. Existing syllabi remain visible as before. Once you create scope-specific syllabi, students will automatically see the most relevant one.

### Q: How long does the migration take?

**A:** For most databases, the migration completes in under 5 minutes. Larger databases (>10,000 syllabi) may take 10-15 minutes.

### Q: Can I run the migration during business hours?

**A:** We recommend running during low-usage periods. The migration requires brief downtime (5-15 minutes).

### Q: What if the migration fails?

**A:** The migration is transactional. If it fails, changes are rolled back automatically. You can then investigate the issue and retry.

### Q: Do I need to retrain users?

**A:** Basic functionality remains the same. Users should be trained on new features (scope selection, filtering, cloning) but can continue using the system as before.

### Q: Are there any breaking changes in the API?

**A:** The old API methods are deprecated but still work. New methods provide enhanced functionality. Gradually migrate to new methods.

### Q: How do I handle syllabi created during migration?

**A:** Schedule migration during maintenance window when no users are creating syllabi. Any syllabi created immediately before migration will be preserved.

### Q: Can I customize the default values for existing syllabi?

**A:** Yes, after migration you can run SQL updates to set different defaults (e.g., specific academic year, tags, etc.).

### Q: What about syllabi with special characters or large documents?

**A:** All data types are preserved. Special characters and large documents are handled correctly.

### Q: How do I verify the migration was successful?

**A:** Follow the [Post-Migration Verification](#post-migration-verification) checklist. All tests should pass.

### Q: Can I migrate in stages (e.g., one subject at a time)?

**A:** The schema migration must be done all at once. However, you can gradually create scope-specific syllabi after migration.

### Q: What happens to syllabus URLs?

**A:** All existing URLs continue to work. New syllabi get new URLs based on their IDs.

### Q: How do I handle syllabi shared across multiple classes?

**A:** Create a subject-wide syllabus (no class specified) which will be available to all classes.

---

## Migration Timeline

### Recommended Schedule

**Week 1: Preparation**
- Review documentation
- Test in development environment
- Create backup procedures
- Plan communication to users

**Week 2: Testing**
- Run migration in staging environment
- Perform thorough testing
- Document any issues
- Refine procedures

**Week 3: Production Migration**
- Schedule maintenance window
- Notify users
- Execute migration
- Verify success
- Monitor for issues

**Week 4: Post-Migration**
- Train users on new features
- Gather feedback
- Create scope-specific syllabi as needed
- Optimize and refine

---

## Support and Resources

### Getting Help

If you encounter issues during migration:

1. **Check Logs**: Review application and database logs
2. **Consult Documentation**: Re-read relevant sections
3. **Test Environment**: Reproduce issue in test environment
4. **Contact Support**: Reach out to technical support team

### Support Channels

- **Email**: support@yourschool.edu
- **Phone**: (555) 123-4567
- **Slack**: #syllabus-migration channel
- **Documentation**: https://docs.yourschool.edu/syllabus

### Additional Resources

- [API Reference](./ENHANCED_SYLLABUS_API_REFERENCE.md)
- [User Guide](./ENHANCED_SYLLABUS_USER_GUIDE.md)
- [Best Practices](./ENHANCED_SYLLABUS_BEST_PRACTICES.md)
- [Troubleshooting Guide](./ENHANCED_SYLLABUS_TROUBLESHOOTING.md)

---

## Appendix

### Sample Migration SQL

```sql
-- This is automatically generated by Prisma
-- Shown here for reference only

-- Add new columns
ALTER TABLE "Syllabus" ADD COLUMN "academicYearId" TEXT;
ALTER TABLE "Syllabus" ADD COLUMN "classId" TEXT;
ALTER TABLE "Syllabus" ADD COLUMN "sectionId" TEXT;
ALTER TABLE "Syllabus" ADD COLUMN "curriculumType" TEXT NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "Syllabus" ADD COLUMN "boardType" TEXT;
ALTER TABLE "Syllabus" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "Syllabus" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Syllabus" ADD COLUMN "effectiveFrom" TIMESTAMP(3);
ALTER TABLE "Syllabus" ADD COLUMN "effectiveTo" TIMESTAMP(3);
ALTER TABLE "Syllabus" ADD COLUMN "version" TEXT NOT NULL DEFAULT '1.0';
ALTER TABLE "Syllabus" ADD COLUMN "parentSyllabusId" TEXT;
ALTER TABLE "Syllabus" ADD COLUMN "createdBy" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Syllabus" ADD COLUMN "updatedBy" TEXT;
ALTER TABLE "Syllabus" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "Syllabus" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "Syllabus" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Syllabus" ADD COLUMN "difficultyLevel" TEXT NOT NULL DEFAULT 'INTERMEDIATE';
ALTER TABLE "Syllabus" ADD COLUMN "estimatedHours" INTEGER;
ALTER TABLE "Syllabus" ADD COLUMN "prerequisites" TEXT;

-- Add foreign keys
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_academicYearId_fkey" 
  FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL;
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_classId_fkey" 
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL;
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_sectionId_fkey" 
  FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE SET NULL;
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_parentSyllabusId_fkey" 
  FOREIGN KEY ("parentSyllabusId") REFERENCES "Syllabus"("id") ON DELETE SET NULL;

-- Create unique constraint
CREATE UNIQUE INDEX "Syllabus_subjectId_academicYearId_classId_sectionId_curriculumType_key" 
  ON "Syllabus"("subjectId", "academicYearId", "classId", "sectionId", "curriculumType");

-- Create indexes
CREATE INDEX "Syllabus_subjectId_classId_idx" ON "Syllabus"("subjectId", "classId");
CREATE INDEX "Syllabus_academicYearId_isActive_idx" ON "Syllabus"("academicYearId", "isActive");
CREATE INDEX "Syllabus_status_isActive_idx" ON "Syllabus"("status", "isActive");
CREATE INDEX "Syllabus_curriculumType_boardType_idx" ON "Syllabus"("curriculumType", "boardType");
```

### Migration Checklist

Print this checklist and check off items as you complete them:

**Pre-Migration**
- [ ] Database backup created
- [ ] Backup verified
- [ ] Test environment migration successful
- [ ] Users notified
- [ ] Maintenance window scheduled
- [ ] Rollback procedure documented

**Migration**
- [ ] Application stopped
- [ ] Migration executed
- [ ] Schema verified
- [ ] Data verified
- [ ] Indexes verified
- [ ] Application code updated

**Post-Migration**
- [ ] Application restarted
- [ ] Health check passed
- [ ] Existing syllabi visible
- [ ] New syllabus creation works
- [ ] Filtering works
- [ ] Fallback logic works
- [ ] Performance acceptable
- [ ] Users notified of completion

**Follow-Up**
- [ ] User training scheduled
- [ ] Documentation updated
- [ ] Feedback collected
- [ ] Issues resolved
- [ ] Optimization completed
