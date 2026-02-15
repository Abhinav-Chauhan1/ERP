# Schema Cleanup Action Plan
## Step-by-Step Guide to Clean Up Your Prisma Schema

Generated: February 9, 2026

---

## 🎯 GOAL

Clean up 45 unused Prisma models and ~100 broken infrastructure files to achieve:
- **30-40% smaller schema**
- **Zero broken/dead code**
- **Clearer codebase**
- **Faster development**

---

## 📊 CURRENT STATE

| Category | Count | Status |
|----------|-------|--------|
| Total Models | 150+ | 😰 Too many |
| Actually Used | ~50 | ✅ Working |
| Unused Models | 45 | ❌ Dead weight |
| Broken Files | ~100 | 🔴 Non-functional |

---

## 🚀 ACTION PLAN

### Phase 1: SAFE DELETIONS (Today - 30 minutes)

Delete 11 models with **ZERO infrastructure**:

#### Step 1.1: Edit `prisma/schema.prisma`

Remove these models (search and delete entire model blocks):

```prisma
// DELETE THESE MODELS
model SavedReportConfig { }
model PromotionRecord { }
model SystemHealth { }
model PerformanceMetric { }
model CommunicationErrorLog { }
model ReportCardTemplate { }
model LessonQuiz { }
model QuizAttempt { }
model LessonProgress { }
model SubModuleProgress { }
model StudentXPLevel { }
```

#### Step 1.2: Create Migration

```bash
npx prisma migrate dev --name remove-unused-models-phase1
```

#### Step 1.3: Verify

```bash
npm run build
# Should complete with no errors
```

**Impact**: ZERO (no code references these models)  
**Risk**: NONE  
**Time**: 5 minutes

---

### Phase 2: DELETE STUB INFRASTRUCTURE (This Week - 3 hours)

Delete 10 models with minimal broken infrastructure:

#### Step 2.1: Delete Stub Files

```bash
# Create cleanup script
cat > scripts/cleanup-stubs.sh << 'EOF'
#!/bin/bash

echo "Deleting stub infrastructure..."

# MessageLog stubs
find src -type f -name "*message-log*" -delete
find src -type f -name "*messageLog*" -delete

# Flashcard stubs
find src -type f -name "*flashcard*" -delete

# Budget/Expense stubs
find src -type f -name "*budget*" -delete
find src -type f -name "*expense*" -delete

# Driver stubs (part of transport)
find src -type f -name "*driver*" -delete

# CoScholastic stubs
find src -type f -name "*co-scholastic*" -delete
find src -type f -name "*coscholastic*" -delete

# SubjectMark stubs
find src -type f -name "*subject-mark*" -delete

# Student Portal Phase 2 stubs
find src -type f -name "*student-note*" -delete
find src -type f -name "*student-achievement*" -delete
find src -type f -name "*lesson-content*" -delete

echo "✅ Stub files deleted"
EOF

chmod +x scripts/cleanup-stubs.sh
./scripts/cleanup-stubs.sh
```

#### Step 2.2: Remove Models from Schema

```prisma
// DELETE THESE MODELS
model MessageLog { }
model Flashcard { }
model FlashcardDeck { }
model Budget { }
model Expense { }
model Driver { }
model CoScholasticActivity { }
model CoScholasticGrade { }
model SubjectMarkConfig { }
model StudentNote { }
model StudentAchievement { }
model LessonContent { }
model StudentContentProgress { }
```

#### Step 2.3: Create Migration

```bash
npx prisma migrate dev --name remove-stub-models-phase2
```

#### Step 2.4: Test Build

```bash
npm run build
# Fix any import errors that appear
```

**Impact**: LOW (features never worked)  
**Risk**: LOW  
**Time**: 2-3 hours

---

### Phase 3: DECISION ON BROKEN MODULES (This Week - Decision Required)

You have 3 major broken modules. **DECIDE** for each:

#### Option A: FIX (if feature is needed)
#### Option B: DELETE (if feature not needed)

---

#### Module 1: SCHOLARSHIP MANAGEMENT

**Infrastructure**: 10 files (actions, components, pages)  
**Problem**: Missing `schoolId` in model

**Option A: FIX**
```prisma
// Add to schema
model Scholarship {
  id          String   @id @default(cuid())
  schoolId    String   // ← ADD THIS
  name        String
  amount      Float
  eligibility String?
  // ... rest
  
  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  @@index([schoolId])
}
```

**Option B: DELETE**
```bash
rm src/lib/actions/scholarshipActions.ts
find src -name "*scholarship*" -delete
# Remove model from schema
```

**Decision**: [ ] FIX  [ ] DELETE

---

#### Module 2: TRANSPORT MANAGEMENT

**Infrastructure**: 50+ files (Vehicle, Driver, Route, RouteStop, StudentRoute, TransportAttendance)  
**Problem**: Queries fail despite having schoolId

**Option A: FIX**
```bash
# Debug why queries fail
# Check if models are properly generated
npx prisma generate
npx prisma db push
```

**Option B: DELETE**
```bash
# Delete all transport files
rm src/lib/actions/vehicleActions.ts
rm src/lib/actions/routeActions.ts
rm src/lib/actions/transportAttendanceActions.ts
rm -rf src/components/admin/transport/
rm -rf src/app/admin/transport/

# Remove models from schema
# - Vehicle
# - Driver  
# - Route
# - RouteStop
# - StudentRoute
# - TransportAttendance
```

**Decision**: [ ] FIX  [ ] DELETE

---

#### Module 3: ALUMNI MANAGEMENT

**Infrastructure**: 38 files (actions, components, pages)  
**Problem**: Queries fail despite having schoolId

**Option A: FIX**
```bash
# Debug why queries fail
# Check alumniActions.ts
```

**Option B: DELETE**
```bash
rm src/lib/actions/alumniActions.ts
rm -rf src/components/admin/alumni/
rm -rf src/app/admin/alumni/

# Remove model from schema
# - Alumni
```

**Decision**: [ ] FIX  [ ] DELETE

---

### Phase 4: VERIFY FALSE POSITIVES (Next Week - 2 hours)

These models show high file counts but may be false positives:

#### 4.1: Session (414 files)

**Check**: Are these referring to NextAuth Session model or just "session" keyword?

```bash
# Search for actual Session model usage
grep -r "prisma\.session\." src/
grep -r "db\.session\." src/

# If 0 results, it's a false positive
```

**Action**: If false positive → Delete `Session` model from schema

---

#### 4.2: Account (127 files)

**Check**: Are these referring to NextAuth Account model?

```bash
grep -r "prisma\.account\." src/
grep -r "db\.account\." src/
```

**Action**: If false positive → Delete `Account` model from schema

---

#### 4.3: VerificationToken (86 files)

**Check**: Are these referring to VerificationToken model?

```bash
grep -r "prisma\.verificationToken\." src/
grep -r "db\.verificationToken\." src/
```

**Action**: If false positive → Delete `VerificationToken` model from schema

---

#### 4.4: Route (213 files)

**Check**: Are these referring to Transport Route model or Next.js routes?

```bash
grep -r "prisma\.route\." src/
grep -r "db\.route\." src/
```

**Action**: Likely false positive (Next.js routing)

---

### Phase 5: FINAL CLEANUP (Next Week - 1 hour)

#### 5.1: Remove Legacy Subscription Model

```prisma
// DELETE THIS (replaced by EnhancedSubscription)
model Subscription {
  id            String   @id
  schoolId      String
  billingCycle  String
  // ...
}
```

**Verification**: All code uses `EnhancedSubscription` (81 usages)

---

#### 5.2: Migrate Event → CalendarEvent

Only 3 usages of old `Event` model:

```bash
# Find the 3 usages
grep -r "prisma\.event\." src/

# Replace with calendarEvent
# Then delete Event model
```

---

#### 5.3: Clean Up User Legacy Fields

After data migration:

```prisma
model User {
  // Remove these legacy fields:
  // firstName    String?
  // lastName     String?
  // phone        String?
  // password     String?
  // image        String?
}
```

---

## 📋 CHECKLIST

### Phase 1: Safe Deletions ✅
- [ ] Delete 11 clean models from schema
- [ ] Run migration
- [ ] Test build
- [ ] Commit changes

### Phase 2: Stub Infrastructure ✅
- [ ] Run cleanup script
- [ ] Delete 13 stub models from schema
- [ ] Run migration
- [ ] Test build
- [ ] Fix any import errors
- [ ] Commit changes

### Phase 3: Broken Modules 🤔
- [ ] **DECIDE**: Scholarship - Fix or Delete?
- [ ] **DECIDE**: Transport - Fix or Delete?
- [ ] **DECIDE**: Alumni - Fix or Delete?
- [ ] Execute decision
- [ ] Test affected features
- [ ] Commit changes

### Phase 4: False Positives ✅
- [ ] Verify Session model usage
- [ ] Verify Account model usage
- [ ] Verify VerificationToken usage
- [ ] Delete if confirmed unused
- [ ] Commit changes

### Phase 5: Final Cleanup ✅
- [ ] Delete Subscription model
- [ ] Migrate Event → CalendarEvent
- [ ] Clean User legacy fields
- [ ] Final migration
- [ ] Full test suite
- [ ] Commit changes

---

## 🎉 EXPECTED RESULTS

### Before Cleanup
```
Models: 150+
Schema Size: ~4,762 lines
Broken Files: ~100
Confusion Level: HIGH
```

### After Cleanup
```
Models: ~105 (30% reduction)
Schema Size: ~3,300 lines (30% reduction)
Broken Files: 0
Confusion Level: LOW
```

---

## ⚠️ IMPORTANT NOTES

1. **Backup First**: Create database backup before migrations
2. **Test Thoroughly**: Run full test suite after each phase
3. **Gradual Approach**: Do one phase at a time
4. **Team Communication**: Inform team about deletions
5. **Documentation**: Update docs to reflect removed features

---

## 🔧 USEFUL COMMANDS

```bash
# Check model usage
grep -r "prisma\.modelName\." src/

# Find files referencing a keyword
find src -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "keyword"

# Count references
grep -r "keyword" src/ | wc -l

# Test build
npm run build

# Run migrations
npx prisma migrate dev --name migration-name

# Generate Prisma Client
npx prisma generate

# Check schema
npx prisma validate
```

---

## 📞 NEED HELP?

If you encounter issues:

1. **Check migration logs**: `prisma/migrations/`
2. **Verify Prisma Client**: `npx prisma generate`
3. **Check build errors**: `npm run build`
4. **Review this document**: Re-read relevant phase

---

**Generated by**: Kiro AI Assistant  
**Date**: February 9, 2026  
**Estimated Total Time**: 1-2 days  
**Estimated Impact**: 30-40% schema reduction
