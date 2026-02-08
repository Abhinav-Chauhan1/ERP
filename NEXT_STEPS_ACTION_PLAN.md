# Next Steps - Action Plan

**Date**: February 8, 2026  
**Priority**: CRITICAL

---

## 🎯 Immediate Actions (Next 2 Hours)

### 1. Deploy P0 Fixes to Staging ⚡ URGENT
```bash
# Commit P0 fixes
git add .
git commit -m "fix: P0 school isolation fixes - 8 files, 28 functions"
git push origin main

# Deploy to staging
npm run deploy:staging
```

### 2. Test P0 Fixes in Staging
- [ ] Login as School A
- [ ] Test exam results page
- [ ] Test attendance reports
- [ ] Test marks export
- [ ] Test performance analytics
- [ ] Login as School B
- [ ] Verify different data
- [ ] Verify no cross-school leakage

### 3. Deploy P0 to Production (if tests pass)
```bash
npm run deploy:production
```

---

## 📋 Today's Work (Next 6-8 Hours)

### Phase 1: Complete Teacher Files (4-5 hours)

#### File 1: teacherResultsActions.ts
**Functions to fix**: 6
```bash
# Open file
code src/lib/actions/teacherResultsActions.ts

# Add to each function:
# 1. const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
# 2. const schoolId = await getRequiredSchoolId();
# 3. Add schoolId to all db queries

# Test
npm run build
npm test
```

#### File 2: teacherDashboardActions.ts
**Functions to fix**: 7
```bash
code src/lib/actions/teacherDashboardActions.ts
# Apply same pattern
```

#### File 3: teacherTimetableActions.ts
**Functions to fix**: ~5
```bash
code src/lib/actions/teacherTimetableActions.ts
# Apply same pattern
```

### Phase 2: Start Parent Files (2-3 hours)

#### File 4: parent-performance-actions.ts
```bash
code src/lib/actions/parent-performance-actions.ts
# Apply same pattern
```

#### File 5: parent-academic-actions.ts
```bash
code src/lib/actions/parent-academic-actions.ts
# Apply same pattern
```

---

## 📅 This Week's Plan

### Monday (Today)
- [x] Complete P0 fixes
- [x] Create documentation
- [ ] Deploy P0 to production
- [ ] Fix 3 teacher files
- [ ] Start parent files

### Tuesday
- [ ] Complete parent files (4 files)
- [ ] Test parent portal thoroughly
- [ ] Deploy parent fixes

### Wednesday
- [ ] Fix student-performance-actions.ts
- [ ] Fix bulkMessagingActions.ts
- [ ] Fix messageAnalyticsActions.ts
- [ ] Test messaging system

### Thursday
- [ ] Fix list-actions.ts
- [ ] Fix students-filters.ts
- [ ] Fix teachers-filters.ts
- [ ] Fix parents-filters.ts
- [ ] Test all list/filter functionality

### Friday
- [ ] Final testing of all P1 fixes
- [ ] Deploy all P1 fixes to production
- [ ] Monitor for 24 hours
- [ ] Document lessons learned

---

## 🛠️ Quick Reference

### Fix Pattern (Copy-Paste)
```typescript
// Add at start of EVERY function
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();

// Add to EVERY db query
const data = await db.model.findMany({
  where: {
    schoolId, // ADD THIS LINE
    // ... other filters
  }
});
```

### Testing Commands
```bash
# TypeScript check
npm run build

# Run tests
npm test

# Lint
npm run lint

# Deploy staging
npm run deploy:staging

# Deploy production
npm run deploy:production
```

### Files to Fix (Priority Order)
1. ✅ teacherStudentsActions.ts (DONE)
2. ⏳ teacherResultsActions.ts
3. ⏳ teacherDashboardActions.ts
4. ⏳ teacherTimetableActions.ts
5. ⏳ parent-performance-actions.ts
6. ⏳ parent-academic-actions.ts
7. ⏳ parent-attendance-actions.ts
8. ⏳ parent-document-actions.ts
9. ⏳ student-performance-actions.ts
10. ⏳ bulkMessagingActions.ts
11. ⏳ messageAnalyticsActions.ts
12. ⏳ list-actions.ts
13. ⏳ students-filters.ts
14. ⏳ teachers-filters.ts
15. ⏳ parents-filters.ts

---

## 📚 Documentation Reference

- **Fix Pattern**: `scripts/fix-school-isolation-template.md`
- **P0 Complete**: `docs/SCHOOL_ISOLATION_P0_FIXES_COMPLETE.md`
- **P1 Plan**: `docs/SCHOOL_ISOLATION_P1_FIXES_PLAN.md`
- **Application Guide**: `scripts/apply-p1-school-isolation-fixes.md`
- **Progress Tracker**: `docs/SCHOOL_ISOLATION_P1_PROGRESS.md`
- **Overall Summary**: `SCHOOL_ISOLATION_FIXES_SUMMARY.md`

---

## ✅ Success Checklist

### P0 Deployment
- [ ] P0 fixes tested in staging
- [ ] No errors in staging
- [ ] Cross-school isolation verified
- [ ] P0 fixes deployed to production
- [ ] Production monitoring for 1 hour
- [ ] No errors in production

### P1 Progress
- [ ] 3 teacher files fixed today
- [ ] 4 parent files fixed by Tuesday
- [ ] 3 messaging files fixed by Wednesday
- [ ] 4 list/filter files fixed by Thursday
- [ ] All P1 fixes deployed by Friday

---

## 🚨 If Issues Arise

### Rollback P0
```bash
git revert <commit-hash>
git push origin main
npm run deploy:production
```

### Get Help
- Check documentation in `docs/` folder
- Review fix pattern in `scripts/fix-school-isolation-template.md`
- Check audit findings in `SCHOOL_ISOLATION_AUDIT_FINDINGS.md`

---

## 📊 Progress Tracking

Update `docs/SCHOOL_ISOLATION_P1_PROGRESS.md` after each file:

```markdown
### ✅ teacherResultsActions.ts (COMPLETE)
**Functions Fixed**: 6/6 (100%)
- ✅ getTeacherResults
- ✅ getExamResultDetails
- ✅ getAssignmentResultDetails
- ✅ updateExamResults
- ✅ getStudentPerformanceData
- ✅ getClassPerformanceData
```

---

**START HERE**: Deploy P0 fixes to staging, test, then deploy to production. Then continue with teacher files.

**REMEMBER**: Every database query MUST have `schoolId` filter!

**Last Updated**: February 8, 2026, 7:45 PM IST
