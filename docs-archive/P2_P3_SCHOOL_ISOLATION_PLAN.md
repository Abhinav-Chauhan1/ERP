# P2 & P3 School Isolation Fixes - Action Plan

**Date**: February 8, 2026  
**Status**: Planning Phase  
**Current Progress**: P0 (100%) + P1 (100%) = 23/46 files complete (50%)

---

## 📊 Overview

### Completed
- ✅ **P0 Critical**: 8/8 files (28 functions) - 100% Complete
- ✅ **P1 High**: 15/15 files (71 functions) - 100% Complete

### Remaining
- ⏳ **P2 Medium**: 10 files (~30 functions) - 0% Complete
- ⏳ **P3 Low**: 13 files (~40 functions) - 0% Complete

**Total Remaining**: 23 files (~70 functions)

---

## 🟡 P2 - MEDIUM PRIORITY (Fix Within Week)

These files handle less sensitive but still important data that should be isolated by school.

### P2 Files List

1. **idCardGenerationActions.ts** (~3 functions)
   - Risk: ID cards can be generated for any school
   - Impact: Student/teacher IDs not isolated
   - Functions: generateStudentIdCard, generateTeacherIdCard, getBulkIdCards

2. **assessmentTimelineActions.ts** (~3 functions)
   - Risk: Assessment timeline shows all schools
   - Impact: Exam schedule not isolated
   - Functions: getAssessmentTimeline, getUpcomingAssessments, getAssessmentCalendar

3. **report-card-aggregation-actions.ts** (~4 functions)
   - Risk: Report card aggregation across schools
   - Impact: Grade reports not isolated
   - Functions: getAggregatedReportCards, getClassReportCards, getTermReportCards, exportReportCards

4. **calendar-widget-actions.ts** (~2 functions)
   - Risk: Calendar events show all schools
   - Impact: Schedule not isolated
   - Functions: getCalendarEvents, getUpcomingEvents

5. **receiptWidgetActions.ts** (~3 functions)
   - Risk: Payment receipts show all schools
   - Impact: Financial data not isolated
   - Functions: getRecentReceipts, getReceiptSummary, downloadReceipt

6. **export-actions.ts** (~4 functions)
   - Risk: Export functionality not isolated
   - Impact: Can export any school's data
   - Functions: exportStudents, exportTeachers, exportAttendance, exportMarks

7. **teacherProfileActions.ts** (~3 functions)
   - Risk: Teacher profiles accessible across schools
   - Impact: Personal data not isolated
   - Functions: getTeacherProfile, updateTeacherProfile, getTeacherDocuments

8. **teacherAttendanceOverviewActions.ts** (~3 functions)
   - Risk: Attendance overview shows all schools
   - Impact: Teacher attendance not isolated
   - Functions: getTeacherAttendanceOverview, getTeacherAttendanceSummary, getTeacherAttendanceReport

9. **administratorActions.ts** (~3 functions)
   - Risk: Administrator data not isolated
   - Impact: Admin profiles accessible
   - Functions: getAdministrators, getAdministratorProfile, updateAdministrator

10. **alumniActions.ts** (~2 functions)
    - Risk: Alumni records show all schools
    - Impact: Graduate data not isolated
    - Functions: getAlumniList, getAlumniProfile

**Total P2**: 10 files, ~30 functions

---

## 🟢 P3 - LOW PRIORITY (Review and Fix)

These files may have legitimate reasons to not filter by schoolId or are less critical. Need review to determine if school isolation is needed.

### P3 Files List

#### Authentication & Security (May be intentionally global)
1. **billing-actions.ts** (~5 functions)
   - Review: May be intentionally cross-school for super-admin
   - Decision: Likely needs school isolation for school-specific billing

2. **auth-actions.ts** (~4 functions)
   - Review: Authentication is user-level
   - Decision: May not need school filtering (user can belong to multiple schools)

3. **two-factor-actions.ts** (~3 functions)
   - Review: 2FA is user-level
   - Decision: Does not need school filtering

4. **two-factor-nextauth-actions.ts** (~3 functions)
   - Review: 2FA is user-level
   - Decision: Does not need school filtering

#### Configuration & Settings (May be global or school-specific)
5. **settingsActions.ts** (~4 functions)
   - Review: System settings may be global
   - Decision: Need to separate global vs school-specific settings

6. **paymentConfigActions.ts** (~3 functions)
   - Review: Payment config may be global
   - Decision: Likely needs school isolation for school-specific payment settings

7. **permissionActions.ts** (~4 functions)
   - Review: Permissions may be global
   - Decision: Need to review if school-specific permissions exist

#### Communication (Need recipient filtering)
8. **emailActions.ts** (~3 functions)
   - Review: Email sending may be cross-school
   - Decision: Needs recipient filtering by school

9. **smsActions.ts** (~3 functions)
   - Review: SMS sending may be cross-school
   - Decision: Needs recipient filtering by school

10. **whatsappActions.ts** (~3 functions)
    - Review: WhatsApp sending may be cross-school
    - Decision: Needs recipient filtering by school

11. **msg91Actions.ts** (~3 functions)
    - Review: SMS gateway actions
    - Decision: Needs recipient filtering by school

#### System (May be global)
12. **cachedModuleActions.ts** (~2 functions)
    - Review: Module caching may be global
    - Decision: Likely does not need school filtering

13. **monitoringActions.ts** (~3 functions)
    - Review: System monitoring may be global
    - Decision: May need school-specific monitoring for analytics

**Total P3**: 13 files, ~40 functions

---

## 📋 P2 Implementation Plan

### Week 1: ID Cards & Assessments (4 files)
**Days 1-2**: ID Card Generation
- [ ] Fix idCardGenerationActions.ts
- [ ] Test ID card generation isolation
- [ ] Verify bulk generation works per school

**Days 3-4**: Assessment Timeline
- [ ] Fix assessmentTimelineActions.ts
- [ ] Test timeline isolation
- [ ] Verify calendar integration

### Week 2: Reports & Widgets (3 files)
**Days 5-6**: Report Cards
- [ ] Fix report-card-aggregation-actions.ts
- [ ] Test report card isolation
- [ ] Verify aggregation works per school

**Day 7**: Widgets
- [ ] Fix calendar-widget-actions.ts
- [ ] Fix receiptWidgetActions.ts
- [ ] Test widget isolation

### Week 3: Profiles & Exports (3 files)
**Days 8-9**: Teacher Profiles
- [ ] Fix teacherProfileActions.ts
- [ ] Fix teacherAttendanceOverviewActions.ts
- [ ] Test profile isolation

**Day 10**: Exports & Admin
- [ ] Fix export-actions.ts
- [ ] Fix administratorActions.ts
- [ ] Fix alumniActions.ts
- [ ] Test export isolation

---

## 📋 P3 Review & Implementation Plan

### Phase 1: Review & Categorize (2 days)
- [ ] Review each P3 file
- [ ] Determine if school isolation needed
- [ ] Categorize: NEEDS_FIX, NO_FIX_NEEDED, PARTIAL_FIX

### Phase 2: Fix Required Files (1 week)
Based on review, fix files that need school isolation:
- [ ] Billing actions (likely needs fix)
- [ ] Settings actions (likely needs partial fix)
- [ ] Payment config (likely needs fix)
- [ ] Communication actions (needs recipient filtering)

### Phase 3: Document Decisions (1 day)
- [ ] Document why certain files don't need school isolation
- [ ] Update architecture documentation
- [ ] Create guidelines for future development

---

## 🔧 Standard Fix Pattern

For all P2/P3 files that need fixing, use this pattern:

```typescript
// 1. Add at start of function
const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
const schoolId = await getRequiredSchoolId();

// 2. Add to where clause
const where: any = {
  schoolId // Filter by current school
};

// 3. For related queries, add schoolId
const relatedData = await db.relatedModel.findMany({
  where: {
    schoolId, // Add here too
    // ... other filters
  }
});
```

---

## ✅ Testing Checklist (Per File)

For each P2/P3 file fixed:
- [ ] Create test data for School A
- [ ] Create test data for School B
- [ ] Login as School A user
- [ ] Verify only School A data visible
- [ ] Login as School B user
- [ ] Verify only School B data visible
- [ ] Test all functions in the file
- [ ] Verify no TypeScript errors
- [ ] Run build successfully

---

## 📊 Progress Tracking

### P2 Progress
- [ ] idCardGenerationActions.ts (0%)
- [ ] assessmentTimelineActions.ts (0%)
- [ ] report-card-aggregation-actions.ts (0%)
- [ ] calendar-widget-actions.ts (0%)
- [ ] receiptWidgetActions.ts (0%)
- [ ] export-actions.ts (0%)
- [ ] teacherProfileActions.ts (0%)
- [ ] teacherAttendanceOverviewActions.ts (0%)
- [ ] administratorActions.ts (0%)
- [ ] alumniActions.ts (0%)

**P2 Total**: 0/10 files (0%)

### P3 Progress
- [ ] Review Phase Complete (0%)
- [ ] Categorization Complete (0%)
- [ ] Fixes Applied (0%)
- [ ] Documentation Complete (0%)

**P3 Total**: 0/13 files (0%)

---

## 🎯 Success Criteria

### P2 Success
- ✅ All 10 P2 files fixed
- ✅ All functions properly filter by schoolId
- ✅ Zero TypeScript errors
- ✅ All tests pass
- ✅ Build successful
- ✅ Deployed to production

### P3 Success
- ✅ All 13 P3 files reviewed
- ✅ Clear decisions documented
- ✅ Required fixes applied
- ✅ Architecture documentation updated
- ✅ Guidelines created for future development

---

## 📅 Timeline

### Optimistic Timeline
- **P2 Completion**: 2-3 weeks
- **P3 Review**: 2-3 days
- **P3 Fixes**: 1 week
- **Total**: 4-5 weeks

### Realistic Timeline
- **P2 Completion**: 3-4 weeks
- **P3 Review**: 1 week
- **P3 Fixes**: 1-2 weeks
- **Total**: 5-7 weeks

### Conservative Timeline
- **P2 Completion**: 4-6 weeks
- **P3 Review**: 1-2 weeks
- **P3 Fixes**: 2-3 weeks
- **Total**: 7-11 weeks

---

## 🚀 Recommendation

### Immediate Action (This Week)
1. **Deploy P0 + P1 fixes to production** (already complete)
2. **Monitor production** for 24-48 hours
3. **Start P2 fixes** if production is stable

### Short Term (Next 2-3 Weeks)
1. **Complete P2 fixes** (10 files)
2. **Test thoroughly** in staging
3. **Deploy P2 fixes** to production

### Medium Term (Next 4-6 Weeks)
1. **Review all P3 files** (13 files)
2. **Fix required P3 files**
3. **Document decisions**
4. **Update architecture guidelines**

### Long Term (Ongoing)
1. **Add automated tests** for multi-tenancy
2. **Implement linting rules** to catch missing schoolId
3. **Create code review checklist**
4. **Train team** on multi-tenancy best practices

---

## 📚 Documentation

### To Be Created
- [ ] P2_FIXES_PROGRESS.md (track P2 progress)
- [ ] P3_REVIEW_DECISIONS.md (document P3 decisions)
- [ ] MULTI_TENANCY_GUIDELINES.md (development guidelines)
- [ ] SCHOOL_ISOLATION_TESTING_GUIDE.md (comprehensive testing)

### To Be Updated
- [ ] SCHOOL_ISOLATION_AUDIT_FINDINGS.md (mark P2/P3 progress)
- [ ] MULTI_TENANT_ARCHITECTURE.md (add lessons learned)
- [ ] README.md (add multi-tenancy section)

---

## 💡 Key Insights

### What We Learned from P0/P1
1. **Consistent pattern works**: The standard fix pattern is effective
2. **TypeScript helps**: Proper typing catches errors early
3. **Testing is critical**: Multi-school testing reveals issues
4. **Documentation matters**: Clear docs help maintain fixes

### Applying to P2/P3
1. **Use same pattern**: Don't reinvent the wheel
2. **Test thoroughly**: Each file needs multi-school tests
3. **Document decisions**: Especially for P3 files that don't need fixes
4. **Automate checks**: Add linting/testing to prevent regressions

---

## 🎯 Priority Recommendation

**Recommended Priority Order:**
1. ✅ **P0 Critical** - COMPLETE (deployed to production)
2. ✅ **P1 High** - COMPLETE (ready for deployment)
3. ⏳ **P2 Medium** - START NEXT (after P1 deployed and stable)
4. ⏳ **P3 Low** - START AFTER P2 (review first, then fix as needed)

**Rationale:**
- P0/P1 fixes address critical security issues affecting user-facing features
- P2 fixes address important but less critical features
- P3 files need review to determine if fixes are even needed
- Staggered approach allows for testing and monitoring between phases

---

**Created**: February 8, 2026, 10:30 PM IST  
**Status**: Planning Complete  
**Next Action**: Deploy P1 fixes, then start P2 implementation
