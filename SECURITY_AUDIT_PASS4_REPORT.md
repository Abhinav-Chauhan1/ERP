# Security Audit Pass 4 Report

**Date**: 2026-03-23  
**Scope**: Remaining unaudited action files and API routes not covered in Passes 1–3  
**Auditor**: Kiro AI  
**Mode**: Read-only — no code changes made

---

## CRITICAL

### C1 — `admissionConversionActions.ts` — `convertAdmissionToStudent` — No auth check
**File**: `src/lib/actions/admissionConversionActions.ts`  
**Function**: `convertAdmissionToStudent`  
**Issue**: Zero `auth()`, `requireSchoolAccess()`, or `currentUser()` call. Any unauthenticated caller can invoke this server action and create a student account + user record in the database. The `applicationId` is accepted from the client with no ownership verification.  
**Impact**: Unauthenticated account creation; cross-school application access (the `admissionApplication.findUnique` has no `schoolId` filter).

### C2 — `admissionConversionActions.ts` — `bulkConvertAdmissionsToStudents` — No auth check
**File**: `src/lib/actions/admissionConversionActions.ts`  
**Function**: `bulkConvertAdmissionsToStudents`  
**Issue**: Delegates entirely to `convertAdmissionToStudent` which has no auth. No auth check of its own either.  
**Impact**: Same as C1, amplified to bulk operations.

### C3 — `admissionConversionActions.ts` — `getStudentFromApplication` — No auth check
**File**: `src/lib/actions/admissionConversionActions.ts`  
**Function**: `getStudentFromApplication`  
**Issue**: Zero auth check. Returns full student record including enrollments, user data, and parent info for any `applicationId` supplied by the caller.  
**Impact**: Unauthenticated data exfiltration of student PII.

---

## HIGH

### H1 — `admissionConversionActions.ts` — `convertAdmissionToStudent` — No `schoolId` filter on application lookup
**File**: `src/lib/actions/admissionConversionActions.ts`  
**Function**: `convertAdmissionToStudent`  
**Issue**: `db.admissionApplication.findUnique({ where: { id: applicationId } })` — no `schoolId` in the where clause. An attacker can supply an `applicationId` from any school and convert it.

### H2 — `promotionActions.ts` — `getStudentsForPromotion` — No `schoolId` filter on enrollment query
**File**: `src/lib/actions/promotionActions.ts`  
**Function**: `getStudentsForPromotion`  
**Issue**: `db.classEnrollment.findMany({ where: enrollmentFilters })` — `enrollmentFilters` is built from `classId`, `sectionId`, `academicYearId` only. No `schoolId` in the where clause. A cross-school `classId` would return students from another school.

### H3 — `promotionActions.ts` — `previewPromotion` — No `schoolId` filter on student query
**File**: `src/lib/actions/promotionActions.ts`  
**Function**: `previewPromotion`  
**Issue**: `db.student.findMany({ where: { id: { in: studentIds } } })` — no `schoolId` filter. Client-supplied `studentIds` from another school would be returned.

### H4 — `promotionActions.ts` — `getPromotionHistory` — No `schoolId` filter
**File**: `src/lib/actions/promotionActions.ts`  
**Function**: `getPromotionHistory`  
**Issue**: `db.promotionHistory.findMany({ where: whereFilters })` — `whereFilters` is built from `academicYear`, `classId`, `startDate`, `endDate` only. No `schoolId`. Returns promotion history across all schools.

### H5 — `promotionActions.ts` — `getPromotionDetails` — No `schoolId` filter
**File**: `src/lib/actions/promotionActions.ts`  
**Function**: `getPromotionDetails`  
**Issue**: `db.promotionHistory.findUnique({ where: { id: historyId } })` — no `schoolId`. Any admin from any school can read any promotion history record.

### H6 — `promotionActions.ts` — `exportPromotionHistory` — No `schoolId` filter
**File**: `src/lib/actions/promotionActions.ts`  
**Function**: `exportPromotionHistory`  
**Issue**: `db.promotionHistory.findMany({ where: whereFilters })` — same as H4, no `schoolId`. Exports cross-school data.

### H7 — `promotionActions.ts` — `rollbackPromotion` — No `schoolId` filter
**File**: `src/lib/actions/promotionActions.ts`  
**Function**: `rollbackPromotion`  
**Issue**: `db.promotionHistory.findUnique({ where: { id: historyId } })` — no `schoolId`. An admin from School A can roll back a promotion from School B.

### H8 — `certificateGenerationActions.ts` — `bulkGenerateCertificates` — No `schoolId` filter on student query
**File**: `src/lib/actions/certificateGenerationActions.ts`  
**Function**: `bulkGenerateCertificates`  
**Issue**: `db.student.findMany({ where: { id: { in: studentIds } } })` — no `schoolId` filter. Client-supplied `studentIds` from another school would be included in certificate generation.

### H9 — `certificateGenerationActions.ts` — `generateCertificateForStudent` — No `schoolId` filter on student query
**File**: `src/lib/actions/certificateGenerationActions.ts`  
**Function**: `generateCertificateForStudent`  
**Issue**: `db.student.findUnique({ where: { id: studentId } })` — no `schoolId` filter. A teacher from School A can generate a certificate for a student from School B.

### H10 — `certificateGenerationActions.ts` — `getGeneratedCertificates` — No `schoolId` filter
**File**: `src/lib/actions/certificateGenerationActions.ts`  
**Function**: `getGeneratedCertificates`  
**Issue**: `db.generatedCertificate.findMany({ where })` — the `where` clause is built from optional `templateId`, `studentId`, `status`, `issuedDate` filters only. No `schoolId`. Returns certificates from all schools.

### H11 — `certificateGenerationActions.ts` — `getCertificatesForStudent` — No auth or school check
**File**: `src/lib/actions/certificateGenerationActions.ts`  
**Function**: `getCertificatesForStudent`  
**Issue**: Calls `getStudentCertificates(studentId)` directly after only checking `currentUser()` (no role check, no school ownership check). Any authenticated user can retrieve any student's certificates.

### H12 — `paymentReceiptActions.ts` — `generateReferenceNumber` — Cross-school count
**File**: `src/lib/actions/paymentReceiptActions.ts`  
**Function**: `generateReferenceNumber` (internal helper)  
**Issue**: `db.paymentReceipt.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } })` — no `schoolId` filter. The daily sequence counter is shared across all schools, causing reference number collisions and leaking cross-school receipt volume.

### H13 — `paymentReceiptActions.ts` — `uploadPaymentReceipt` — Dead code after early return
**File**: `src/lib/actions/paymentReceiptActions.ts`  
**Function**: `uploadPaymentReceipt`  
**Issue**: After the `uploadHandler.uploadImage` call, there is a `try { console.warn(...); return { success: false, error: "..." }; }` block that always returns early. All code after it — including `requireSchoolAccess()`, `generateReferenceNumber()`, and `db.paymentReceipt.create()` — is unreachable dead code. The function always returns a "temporarily disabled" error regardless of input. This is a functional bug masquerading as a security issue: the `schoolId` scoping that was added is never actually executed.

### H14 — `teacherDashboardActions.ts` — `getUnreadMessagesCount` — Message count not scoped to school
**File**: `src/lib/actions/teacherDashboardActions.ts`  
**Function**: `getUnreadMessagesCount`  
**Issue**: `db.message.count({ where: { recipientId: teacher.userId, isRead: false } })` — no `schoolId` filter. Returns unread messages from all schools for the teacher's userId.

### H15 — `api/test/performance/route.ts` — No authentication
**File**: `src/app/api/test/performance/route.ts`  
**Function**: `GET`  
**Issue**: Zero auth check. This endpoint calls `getDashboardAnalytics` and `getBillingDashboardData` and returns performance metrics and query results to any unauthenticated caller. Should be removed or protected in production.

---

## MEDIUM

### M1 — `admissionConversionActions.ts` — No input validation
**File**: `src/lib/actions/admissionConversionActions.ts`  
**Functions**: `convertAdmissionToStudent`, `bulkConvertAdmissionsToStudents`, `getStudentFromApplication`  
**Issue**: No Zod or other schema validation on `applicationId` or `applicationIds` inputs. Raw string passed directly to DB query.

### M2 — `promotionActions.ts` — `getStudentsForPromotion` — `classId` not verified to belong to school
**File**: `src/lib/actions/promotionActions.ts`  
**Function**: `getStudentsForPromotion`  
**Issue**: `classId` is accepted from client input and used in the enrollment query without verifying it belongs to the current school. Combined with H2, this allows cross-school data access.

### M3 — `certificateGenerationActions.ts` — `bulkGenerateCertificates` — No role check for TEACHER
**File**: `src/lib/actions/certificateGenerationActions.ts`  
**Function**: `bulkGenerateCertificates`  
**Issue**: Allows `TEACHER` role to bulk-generate certificates. Teachers should typically only generate certificates for their own students. No further scoping is applied to verify the teacher has access to the supplied `studentIds`.

### M4 — `paymentReceiptActions.ts` — `getStudentReceipts` — No `schoolId` filter on receipt query
**File**: `src/lib/actions/paymentReceiptActions.ts`  
**Function**: `getStudentReceipts`  
**Issue**: `db.paymentReceipt.findMany({ where })` — `where` is built from `studentId`, optional `status`, and optional date range. No `schoolId`. An admin from School A could call this with a `studentId` from School B and retrieve their receipts.

### M5 — `paymentReceiptActions.ts` — `getReceiptById` — No `schoolId` filter
**File**: `src/lib/actions/paymentReceiptActions.ts`  
**Function**: `getReceiptById`  
**Issue**: `db.paymentReceipt.findUnique({ where: { id: receiptId } })` — no `schoolId`. The authorization check is done post-fetch (role-based), but an ADMIN from any school can read any receipt.

### M6 — `paymentReceiptActions.ts` — `getReceiptByReference` — No `schoolId` filter
**File**: `src/lib/actions/paymentReceiptActions.ts`  
**Function**: `getReceiptByReference`  
**Issue**: `db.paymentReceipt.findUnique({ where: { referenceNumber } })` — no `schoolId`. Same issue as M5.

### M7 — `backupActions.ts` — Role check uses session role, not DB role
**File**: `src/lib/actions/backupActions.ts`  
**Functions**: All backup action functions  
**Issue**: Role check is `session?.user?.role !== 'ADMIN'`. This relies on the JWT session role rather than the database role. If a session token is not properly invalidated after a role downgrade, a demoted user could still access backup operations. Low risk in practice but inconsistent with the rest of the codebase which uses `db.user.findUnique` for role verification.

### M8 — `assignmentsActions.ts` — `gradeSubmission` — No `schoolId` filter on submission lookup
**File**: `src/lib/actions/assignmentsActions.ts`  
**Function**: `gradeSubmission`  
**Issue**: `db.assignmentSubmission.findUnique({ where: { id: data.submissionId } })` — no `schoolId` filter. A teacher from School A could grade a submission from School B if they know the submission ID.

### M9 — `classesActions.ts` — `getSectionsWithoutHeadTeacher` — Truncated, partial read
**File**: `src/lib/actions/classesActions.ts`  
**Function**: `getSectionsWithoutHeadTeacher`  
**Issue**: File was truncated at 1077/1392 lines. The function body was not fully visible. The visible portion uses `withSchoolAuthAction` and `schoolId` filters correctly. The remainder could not be verified.

---

## LOW

### L1 — `promotionActions.ts` — `getPromotionHistory` — Sequential independent awaits
**File**: `src/lib/actions/promotionActions.ts`  
**Function**: `getPromotionHistory`  
**Issue**: `db.promotionHistory.count(...)` and `db.promotionHistory.findMany(...)` are called sequentially. Could be `Promise.all`.

### L2 — `promotionActions.ts` — `exportPromotionHistory` — Unbounded `findMany`
**File**: `src/lib/actions/promotionActions.ts`  
**Function**: `exportPromotionHistory`  
**Issue**: `db.promotionHistory.findMany({ where: whereFilters })` — no `take` limit. For large schools with many promotions, this could return thousands of records.

### L3 — `teacherDashboardActions.ts` — `getTeacherDashboardData` — N+1 in class performance
**File**: `src/lib/actions/teacherDashboardActions.ts`  
**Function**: `getTeacherDashboardData`  
**Issue**: `db.class.findMany` includes `sections.enrollments.student.examResults` — deeply nested include that could produce large result sets. Not a strict N+1 but a potentially expensive nested include.

### L4 — `assignmentsActions.ts` — `createAssignment` — Sequential file uploads in loop
**File**: `src/lib/actions/assignmentsActions.ts`  
**Function**: `createAssignment`  
**Issue**: File uploads are done in a `for` loop sequentially. Could be parallelized with `Promise.all`.

### L5 — `assignmentsActions.ts` — `createAssignment` — Sequential `AssignmentClass.create` in loop
**File**: `src/lib/actions/assignmentsActions.ts`  
**Function**: `createAssignment`  
**Issue**: `db.assignmentClass.create` is called in a `for` loop. Should use `createMany`.

### L6 — `smsActions.ts` — `sendBulkSMSAction` — Sequential sends in loop
**File**: `src/lib/actions/smsActions.ts`  
**Function**: `sendBulkSMSAction`  
**Issue**: The `sendBulkSMS` service is called (which handles batching), but the individual `sendSMSWithRetry` calls within it may be sequential. Minor concern — depends on service implementation.

### L7 — `whatsappActions.ts` — `sendBulkWhatsApp` — Sequential sends in loop
**File**: `src/lib/actions/whatsappActions.ts`  
**Function**: `sendBulkWhatsApp`  
**Issue**: `sendTextMessageWithRetry` is called in a `for` loop sequentially. For large recipient lists this will be slow.

### L8 — `certificateGenerationActions.ts` — `getCertificateGenerationStats` — Sequential independent awaits
**File**: `src/lib/actions/certificateGenerationActions.ts`  
**Function**: `getCertificateGenerationStats`  
**Issue**: `db.generatedCertificate.count`, `db.generatedCertificate.groupBy` (status), `db.generatedCertificate.groupBy` (templateId), and `db.generatedCertificate.findMany` are called sequentially. The first three could be `Promise.all`.

---

## CLEAN FILES (no findings)

The following files were read and found to be clean:

- `src/lib/actions/paymentConfigActions.ts` — uses `requireSchoolAccess` + admin check, all queries scoped
- `src/lib/actions/budgetActions.ts` — uses `requireSchoolAccess`, all queries scoped
- `src/lib/actions/expenseActions.ts` — uses `withSchoolAuthAction` + permission checks, all queries scoped
- `src/lib/actions/financialReportActions.ts` — uses `requireSchoolAccess`, all queries scoped
- `src/lib/actions/payrollActions.ts` — uses `withSchoolAuthAction` + PAYROLL permission, all queries scoped
- `src/lib/actions/admissionActions.ts` — uses `withSchoolAuthAction`, all queries scoped
- `src/lib/actions/parent-fee-actions.ts` — uses `getCurrentParent()` + parent-child verification + `schoolId`
- `src/lib/actions/parent-academic-actions.ts` — uses `currentUser()` + parent verification + `schoolId`
- `src/lib/actions/parent-attendance-actions.ts` — uses `currentUser()` + parent verification + `schoolId`
- `src/lib/actions/parent-communication-actions.ts` — uses `getCurrentParent()` helper with `requireSchoolAccess`, all queries scoped with `schoolId`
- `src/lib/actions/parent-children-actions.ts` — uses `getCurrentParent()`, all queries include `schoolId` and parent-child ownership check
- `src/lib/actions/teacherActions.ts` — uses `requireSchoolAccess`, all queries scoped
- `src/lib/actions/studentActions.ts` — uses `requireSchoolAccess` + `hasPermission`, all queries scoped
- `src/lib/actions/academicActions.ts` — uses `withSchoolAuthAction`, all queries scoped
- `src/lib/actions/examsActions.ts` — uses `withSchoolAuthAction`, all queries scoped with `schoolId`
- `src/lib/actions/administratorActions.ts` — uses `auth()` + `getRequiredSchoolId()`, query scoped
- `src/lib/actions/teacherDashboardActions.ts` — uses `getRequiredSchoolId()` + `auth()`, all queries scoped (except H14 noted above)
- `src/lib/actions/teacherProfileActions.ts` — uses `auth()` + `getRequiredSchoolId()`, all queries scoped
- `src/lib/actions/classesActions.ts` — uses `withSchoolAuthAction` + `requireSchoolAccess`, all queries scoped
- `src/lib/actions/subjectsActions.ts` — uses `withSchoolAuthAction`, all queries scoped
- `src/lib/actions/assignmentsActions.ts` — uses `requireSchoolAccess`, all queries scoped (except M8)
- `src/lib/actions/marksEntryActions.ts` — uses `withSchoolAuthAction` + `requireSchoolAccess` + `hasPermission`, all queries scoped
- `src/lib/actions/backupActions.ts` — uses `auth()` + ADMIN role check (see M7 for minor concern)
- `src/lib/actions/settingsActions.ts` — uses `auth()` + admin role check + `getRequiredSchoolId()`, all queries scoped
- `src/lib/actions/whatsappActions.ts` — uses `auth()` + ADMIN role check, all operations admin-only
- `src/lib/actions/smsActions.ts` — uses `currentUser()` + ADMIN role check + `getRequiredSchoolId()`, all queries scoped
- `src/lib/actions/emailActions.ts` — uses `currentUser()` + ADMIN role check + `getRequiredSchoolId()`, all queries scoped
- `src/app/api/webhooks/whatsapp/route.ts` — HMAC-SHA256 signature verification with `crypto.timingSafeEqual`, raw body used ✅
- `src/app/api/webhooks/msg91/route.ts` — token-based auth (mandatory), HTTPS enforcement in production ✅
- `src/app/api/webhooks/stripe/route.ts` — HMAC-SHA256 signature verification with `crypto.timingSafeEqual`, timestamp replay protection ✅
- `src/app/api/webhooks/monitoring/route.ts` — HMAC-SHA256 signature verification with `crypto.timingSafeEqual` ✅

---

## STATISTICS

| Severity | Count |
|----------|-------|
| CRITICAL | 3     |
| HIGH     | 15    |
| MEDIUM   | 9     |
| LOW      | 8     |
| **Total**| **35**|

---

## Files Read vs Not Read

### Files Read (Pass 4)
- `src/lib/actions/admissionConversionActions.ts`
- `src/lib/actions/promotionActions.ts`
- `src/lib/actions/paymentReceiptActions.ts`
- `src/lib/actions/parent-communication-actions.ts`
- `src/lib/actions/parent-children-actions.ts`
- `src/lib/actions/teacherActions.ts`
- `src/lib/actions/studentActions.ts`
- `src/lib/actions/academicActions.ts`
- `src/lib/actions/examsActions.ts`
- `src/lib/actions/certificateGenerationActions.ts`
- `src/lib/actions/administratorActions.ts`
- `src/lib/actions/teacherDashboardActions.ts`
- `src/lib/actions/teacherProfileActions.ts`
- `src/lib/actions/classesActions.ts` (partial — 1077/1392 lines)
- `src/lib/actions/subjectsActions.ts`
- `src/lib/actions/assignmentsActions.ts`
- `src/lib/actions/marksEntryActions.ts`
- `src/lib/actions/backupActions.ts`
- `src/lib/actions/settingsActions.ts`
- `src/lib/actions/whatsappActions.ts`
- `src/lib/actions/smsActions.ts`
- `src/lib/actions/emailActions.ts`
- `src/app/api/webhooks/whatsapp/route.ts`
- `src/app/api/webhooks/msg91/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/app/api/webhooks/monitoring/route.ts`
- `src/app/api/test/performance/route.ts`

### Files NOT Read (remaining for Pass 5 if needed)
**Action files:**
- `parent-document-actions.ts`, `parent-event-actions.ts`, `parent-meeting-actions.ts`, `parent-performance-actions.ts`, `parent-settings-actions.ts`, `parent-student-actions.ts`
- `teacherAttendanceActions.ts`, `teacherAttendanceOverviewActions.ts`, `teacherClassesActions.ts`, `teacherAssignmentsActions.ts`, `teacherExamsActions.ts`, `teacher-communication-actions.ts`, `teacher-settings-actions.ts`
- `student-academics-actions.ts`, `student-achievement-actions.ts`, `student-achievements-actions.ts`, `student-assessment-actions.ts`, `student-course-actions.ts`, `student-document-actions.ts`, `student-event-actions.ts`, `student-fee-actions.ts`, `student-notes-actions.ts`, `student-performance-actions.ts`, `student-settings-actions.ts`, `student-actions.ts`, `student-communication-actions.ts`, `student-attendance-actions.ts`
- `academicyearsActions.ts`, `academicReportActions.ts`, `assessmentActions.ts`, `assessmentRulesActions.ts`, `assessmentTimelineActions.ts`, `classesActions.ts` (remaining ~315 lines), `sectionsActions.ts`, `termsActions.ts`, `gradesActions.ts`, `departmentsAction.ts`, `roomsActions.ts`
- `examComponentActions.ts`, `examTypesActions.ts`, `examAnalyticsActions.ts`, `importMarksActions.ts`, `exportMarksActions.ts`, `resultsActions.ts`, `rankCalculationActions.ts`, `meritListActions.ts`, `consolidatedMarkSheetActions.ts`, `gradeCalculationActions.ts`, `coScholasticActions.ts`
- `certificateTemplateActions.ts`, `idCardGenerationActions.ts`, `graduationActions.ts`
- `syllabusActions.ts`, `syllabusDocumentActions.ts`, `curriculumActions.ts`, `moduleActions.ts`, `subModuleActions.ts`, `cachedModuleActions.ts`, `lesson-content-actions.ts`, `flashcard-actions.ts`, `mind-map-actions.ts`
- `onlineExamActions.ts`, `questionBankActions.ts`, `adminQuestionBankActions.ts`, `cbseSetupActions.ts`
- `leaveApplicationsActions.ts`, `scholarshipActions.ts`, `parentMeetingActions.ts`, `parentActions.ts`
- `reportBuilderActions.ts`, `scheduledReportActions.ts`, `performanceAnalyticsActions.ts`, `performanceReportActions.ts`, `subjectPerformanceActions.ts`, `report-card-actions.ts`, `report-card-generation.ts`, `reportCardTemplateActions.ts`
- `msg91Actions.ts`, `messageTemplateActions.ts`, `messageHistoryActions.ts`, `messageAnalyticsActions.ts`, `whatsappInteractiveActions.ts`
- `scheduledBackupActions.ts`, `billing-actions.ts`, `school-management-actions.ts`, `usageActions.ts`, `monitoringActions.ts`
- `upload-actions.ts`, `storage-actions.ts`, `documentActions.ts`, `export-actions.ts`
- `routeActions.ts`, `vehicleActions.ts`, `driverActions.ts`, `transportAttendanceActions.ts`
- `timetableConfigActions.ts`, `timetableTopicActions.ts`, `subjectTeacherActions.ts`, `subjectMarkConfigActions.ts`, `teacherSubjectsActions.ts`, `teacherStudentsActions.ts`, `teacherTimetableActions.ts`, `teacherResultsActions.ts`, `teachingActions.ts`
- `audit-log-actions.ts`, `auth-actions.ts`, `two-factor-actions.ts`, `two-factor-nextauth-actions.ts`, `onboarding-progress-actions.ts`, `change-school-plan-action.ts`, `seed-plans-action.ts`, `userActions.ts`, `progressTrackingActions.ts`
- `receiptNotesActions.ts`, `receiptVerificationActions.ts`, `receiptWidgetActions.ts`
- `bulkImportActions.ts`, `calendar-widget-actions.ts`, `list-actions.ts`

**API routes (not read):**
- `src/app/api/admin/**`
- `src/app/api/schools/**`
- `src/app/api/super-admin/**`
- `src/app/api/search/**`
- `src/app/api/reports/**`
- `src/app/api/permissions/**`
- `src/app/api/notifications/**`
- `src/app/api/parent/**`
- `src/app/api/parents/**`
- `src/app/api/student/**` (most routes)
- `src/app/api/students/**`
- `src/app/api/teacher/**`
- `src/app/api/user/**`
- `src/app/api/users/**` (except `/sync` and `/[id]`)
- `src/app/api/upload/**`
- `src/app/api/r2/**`
- `src/app/api/storage/**`
- `src/app/api/cdn/**` (most routes)
- `src/app/api/cron/**`
- `src/app/api/otp/**`
- `src/app/api/integrations/**`
- `src/app/api/web-vitals/**`
- `src/app/api/example/**`
- `src/app/api/test/**` (except `/performance`)
- `src/app/api/test-rate-limit/**`
- `src/app/api/subdomain/**`
- `src/app/api/files/**` (except `/manage`)
- `src/app/api/classes/**`

---

## Priority Fix Order

1. **CRITICAL (C1–C3)**: `admissionConversionActions.ts` — add `requireSchoolAccess()` + admin role check to all three functions; add `schoolId` to the `admissionApplication.findUnique` query.
2. **HIGH (H1–H7)**: `promotionActions.ts` — add `schoolId` to all `promotionHistory`, `classEnrollment`, and `student` queries.
3. **HIGH (H8–H11)**: `certificateGenerationActions.ts` — add `schoolId` to student queries; add school ownership check to `getCertificatesForStudent`.
4. **HIGH (H12–H13)**: `paymentReceiptActions.ts` — add `schoolId` to `generateReferenceNumber` count; fix dead code in `uploadPaymentReceipt`.
5. **HIGH (H14)**: `teacherDashboardActions.ts` — add `schoolId` to `getUnreadMessagesCount` message count query.
6. **HIGH (H15)**: `api/test/performance/route.ts` — add auth check or remove endpoint entirely.
7. **MEDIUM (M1–M9)**: Input validation, role scoping, and submission ownership fixes.
8. **LOW (L1–L8)**: Performance optimizations.
