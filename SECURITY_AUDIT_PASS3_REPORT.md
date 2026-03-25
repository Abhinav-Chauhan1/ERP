# Security Audit Pass 3 Report

**Date**: 2026-03-23  
**Scope**: All action files and API routes not covered in Pass 1 or Pass 2  
**Type**: Read-only audit — no code changes  

---

## CRITICAL

No CRITICAL findings in this pass. All files read use `withSchoolAuthAction`, `requireSchoolAccess()`, or `auth()` + `getRequiredSchoolId()` before any DB query, and all queries include `schoolId` in the where clause.

---

## HIGH

### H-P3-01 — `src/lib/actions/usersAction.ts` — `updateUserDetails(userId)`
No auth check. No schoolId ownership verification. Any caller can update any user's details including `passwordHash`. The function accepts a `userId` from the client and calls `db.user.update({ where: { id: userId } })` with no session check.

### H-P3-02 — `src/lib/actions/usersAction.ts` — `updateAdministrator(administratorId)`
No auth check. No schoolId ownership verification. Can update any administrator's record including password fields.

### H-P3-03 — `src/lib/actions/usersAction.ts` — `updateTeacher(teacherId)`
No auth check. No schoolId ownership verification. Can update any teacher's record including password fields.

### H-P3-04 — `src/lib/actions/usersAction.ts` — `updateStudent(studentId)`
No auth check. No schoolId ownership verification. Can update any student's record.

### H-P3-05 — `src/lib/actions/usersAction.ts` — `updateParent(parentId)`
No auth check. No schoolId ownership verification. Can update any parent's record.

### H-P3-06 — `src/lib/actions/usersAction.ts` — `getStudentById(studentId)`
No auth check. No schoolId filter. Returns any student across all schools.

### H-P3-07 — `src/lib/actions/usersAction.ts` — `getTeacherById(teacherId)`
No auth check. No schoolId filter. Returns any teacher across all schools.

### H-P3-08 — `src/lib/actions/usersAction.ts` — `getAdministratorById(administratorId)`
No auth check. No schoolId filter. Returns any administrator across all schools.

### H-P3-09 — `src/lib/actions/messageActions.ts` — `forwardMessage(messageId, recipientId)`
The original message is fetched with `db.message.findUnique({ where: { id: messageId } })` — no `schoolId` filter. An attacker can forward any message from any school by supplying a cross-school `messageId`. The `replyToMessage` function correctly adds `schoolId` to the lookup, but `forwardMessage` does not.

### H-P3-10 — `src/lib/actions/messageActions.ts` — `deleteMessage(id)` / `markAsRead(id)`
Both functions fetch the message with `db.message.findUnique({ where: { id } })` — no `schoolId` filter. An attacker can delete or mark-as-read any message across all schools if they know the ID, as long as they are the sender or recipient (which they can be via cross-school user IDs).

### H-P3-11 — `src/lib/actions/messageActions.ts` — `getMessageStats()`
`db.message.count` queries use only `recipientId`/`senderId` — no `schoolId` filter. Stats leak cross-school message counts.

### H-P3-12 — `src/lib/actions/messageActions.ts` — `getWeeklyCommunicationStats()`
`db.message.findMany` uses only `senderId`/`recipientId` — no `schoolId` filter. Returns cross-school message data.

### H-P3-13 — `src/lib/actions/permissionActions.ts` — `getUsersForPermissionManagement()`
`prisma.user.findMany` has no `schoolId` filter. Returns all users across all schools to anyone with `SETTINGS:READ` permission.

### H-P3-14 — `src/lib/actions/permissionActions.ts` — `assignPermissionToUser()` / `removePermissionFromUser()`
`targetUserId` is accepted from the caller with no verification that the target user belongs to the current school. An admin of School A can grant/revoke permissions for users in School B.

---

## MEDIUM

### M-P3-01 — `src/lib/actions/usersAction.ts` — `syncClerkUser()`
No auth check. Creates users with a default `STUDENT` role and no school association. Could be called by unauthenticated clients to create ghost user records.

### M-P3-02 — `src/lib/actions/usersAction.ts` — `associateStudentWithParent()`
No ownership verification that the student and parent both belong to the current school before creating the association. An attacker could link students and parents across schools.

### M-P3-03 — `src/lib/actions/messageActions.ts` — `getMessageById(id)`
Fetches message with `db.message.findUnique({ where: { id } })` — no `schoolId` filter. The ownership check (sender or recipient) is present, but a user who is a member of multiple schools could read messages from a different school context.

### M-P3-04 — `src/lib/actions/feeStructureActions.ts` — `deleteFeeType(id)`
`feeTypeService.deleteFeeType(id)` is called without passing `schoolId`. If the underlying service does not enforce school scoping on delete, a fee type from another school could be deleted.

### M-P3-05 — `src/lib/actions/feeStructureActions.ts` — `getFeeStructureAnalytics()` / `getStudentsAffectedByStructure()` / `calculateRevenueProjection()` / `getFeeStructureUsageTrends()`
The `schoolId` from `withSchoolAuthAction` is received but NOT passed to the analytics service calls (`feeStructureAnalyticsService.getFeeStructureAnalytics(filters || {})`, etc.). If the analytics service does not independently scope by school, these return cross-school data.

### M-P3-06 — `src/lib/actions/feeStructureActions.ts` — `bulkAssignFeeStructuresToClass()` / `bulkRemoveFeeStructuresFromClass()` / `getAvailableFeeStructuresForBulkAssignment()`
The `schoolId` is received but NOT passed to the underlying service calls (`feeStructureService.bulkAssignToClass(classId, feeStructureIds, academicYearId)` etc.). If the service does not independently scope, cross-school bulk operations are possible.

### M-P3-07 — `src/lib/actions/dashboardActions.ts` — redundant `auth()` calls
Every `withSchoolAuthAction`-wrapped function in `dashboardActions.ts` makes an additional `auth()` call inside the handler body. `withSchoolAuthAction` already validates the session; the inner `auth()` calls are redundant and add latency. Not a security issue but a performance concern.

### M-P3-08 — `src/lib/actions/attendanceActions.ts` — `markBulkTeacherAttendance()`
This function calls `markTeacherAttendance()` in a `Promise.all` loop but does NOT call `requireSchoolAccess()` itself — it relies on each inner call to do so. However, `markTeacherAttendance()` does call `requireSchoolAccess()`, so the school scoping is present. The concern is that `markBulkTeacherAttendance` has no permission check of its own (unlike `markStudentAttendance` which checks `ATTENDANCE:CREATE`).

### M-P3-09 — `src/lib/actions/feePaymentActions.ts` — `getFeeStructuresForStudent()` — missing schoolId on feeStructure query
The `db.feeStructure.findMany` query filters by `academicYearId` and `isActive` but does NOT include a `schoolId` filter. Fee structures from other schools with the same `academicYearId` could be returned.

### M-P3-10 — `src/lib/actions/reportCardsActions.ts` — `getAttendanceForReportCard()` / `generateCBSEReportCardAction()` / `generateBatchCBSEReportCardsAction()`
These three standalone `async function` exports (not wrapped with `withSchoolAuthAction`) call `requireSchoolAccess()` directly, which is correct. However, `generateCBSEReportCardAction` fetches school data via `db.school.findUnique({ where: { id: data.student.schoolId } })` using the student's embedded `schoolId` rather than the verified session `schoolId`. If `aggregateMultiTermReportCardData` returns data for a different school, the school info lookup would use that school's ID.

---

## LOW

### L-P3-01 — `src/lib/actions/bulkMessagingActions.ts` — `getBulkMessageHistory()`
`db.auditLog.findMany` has no `schoolId` filter — returns bulk message history across all schools. An admin of School A can see bulk message history from School B.

### L-P3-02 — `src/lib/actions/bulkMessagingActions.ts` — `getBulkMessageProgress(auditLogId)`
`db.auditLog.findUnique({ where: { id: auditLogId } })` has no `schoolId` filter. An admin can query audit log entries from other schools by guessing IDs.

### L-P3-03 — `src/lib/actions/announcementActions.ts` — `getAnnouncements()` — unbounded findMany
`db.announcement.findMany` uses `filters?.limit` and `filters?.offset` but both are optional with no default `take` limit. If called without a limit, all announcements for the school are returned in one query.

### L-P3-04 — `src/lib/actions/attendanceActions.ts` — `getStudentAttendanceReport()` — unbounded findMany
`db.studentAttendance.findMany` has no `take` limit. For a student with years of attendance records, this could return thousands of rows.

### L-P3-05 — `src/lib/actions/dashboardActions.ts` — `getExamResultsData()` — N+1 query
`subjects.map(async (subject) => db.examResult.findMany(...))` inside `Promise.all` is an N+1 pattern — one query per subject. Should use `groupBy` or a single aggregation query.

### L-P3-06 — `src/app/api/upload/route.ts` — no schoolId association on uploaded files
Files are uploaded to `uploads/${user.id}` folder with no school context. If a user belongs to multiple schools, uploaded files are not scoped to a specific school. Not a direct security issue but a data isolation gap.

---

## STATISTICS

| Severity | Count |
|----------|-------|
| CRITICAL | 0     |
| HIGH     | 14    |
| MEDIUM   | 10    |
| LOW      | 6     |
| **Total**| **30**|

**Most dangerous pattern found**: `src/lib/actions/usersAction.ts` — 8 functions with zero auth and zero schoolId filtering (H-P3-01 through H-P3-08). Any authenticated or unauthenticated caller can read or update any user, student, teacher, or administrator record across all schools.

**Second most dangerous**: `src/lib/actions/messageActions.ts` — 4 functions missing schoolId on message lookups (H-P3-09 through H-P3-12, M-P3-03).

---

## Files Read vs Not Read

### Files fully read in Pass 3

**Action files:**
- `src/lib/actions/usersAction.ts` — FINDINGS (H-P3-01 to H-P3-08, M-P3-01, M-P3-02)
- `src/lib/actions/feePaymentActions.ts` — mostly CLEAN; M-P3-09
- `src/lib/actions/feeStructureActions.ts` — mostly CLEAN; M-P3-04, M-P3-05, M-P3-06
- `src/lib/actions/admissionActions.ts` — CLEAN
- `src/lib/actions/messageActions.ts` — FINDINGS (H-P3-09 to H-P3-12, M-P3-03)
- `src/lib/actions/examsActions.ts` — CLEAN
- `src/lib/actions/reportCardsActions.ts` — mostly CLEAN; M-P3-10
- `src/lib/actions/permissionActions.ts` — FINDINGS (H-P3-13, H-P3-14)
- `src/lib/actions/payrollActions.ts` — CLEAN
- `src/lib/actions/bulkMessagingActions.ts` — mostly CLEAN; L-P3-01, L-P3-02
- `src/lib/actions/announcementActions.ts` — mostly CLEAN; L-P3-03
- `src/lib/actions/attendanceActions.ts` — mostly CLEAN; M-P3-08, L-P3-04
- `src/lib/actions/marksEntryActions.ts` — CLEAN
- `src/lib/actions/settingsActions.ts` — CLEAN
- `src/lib/actions/dashboardActions.ts` — mostly CLEAN; M-P3-07, L-P3-05
- `src/lib/actions/analytics-actions.ts` — CLEAN (super-admin only via `requireSuperAdminAccess()`)

**API routes:**
- `src/app/api/super-admin/schools/route.ts` — CLEAN (SUPER_ADMIN role check, Zod validation, rate limiting)
- `src/app/api/students/route.ts` — CLEAN (`withSchoolAuth` + `schoolId` filter)
- `src/app/api/parents/route.ts` — CLEAN (`withSchoolAuth` + `schoolId` filter)
- `src/app/api/upload/route.ts` — mostly CLEAN; L-P3-06

**Previously read (Pass 3 context transfer):**
- `src/lib/actions/studentActions.ts` — CLEAN
- `src/lib/actions/teacherActions.ts` — CLEAN
- `src/lib/actions/userActions.ts` — CLEAN

### Files NOT yet read (deferred to Pass 4)

**Action files:**
- `src/lib/actions/paymentConfigActions.ts`
- `src/lib/actions/paymentReceiptActions.ts`
- `src/lib/actions/budgetActions.ts`
- `src/lib/actions/expenseActions.ts`
- `src/lib/actions/financialReportActions.ts`
- `src/lib/actions/admissionConversionActions.ts`
- `src/lib/actions/graduationActions.ts`
- `src/lib/actions/promotionActions.ts`
- `src/lib/actions/certificateGenerationActions.ts`
- `src/lib/actions/certificateTemplateActions.ts`
- `src/lib/actions/idCardGenerationActions.ts`
- `src/lib/actions/backupActions.ts`
- `src/lib/actions/scheduledBackupActions.ts`
- `src/lib/actions/parent-actions.ts`
- `src/lib/actions/parent-fee-actions.ts`
- `src/lib/actions/parent-academic-actions.ts`
- `src/lib/actions/parent-attendance-actions.ts`
- `src/lib/actions/parent-communication-actions.ts`
- `src/lib/actions/student-fee-actions.ts`
- `src/lib/actions/student-academics-actions.ts`
- `src/lib/actions/student-attendance-actions.ts`
- `src/lib/actions/student-communication-actions.ts`
- `src/lib/actions/student-notes-actions.ts`
- `src/lib/actions/flashcard-actions.ts`
- `src/lib/actions/mind-map-actions.ts`
- `src/lib/actions/lesson-content-actions.ts`
- `src/lib/actions/whatsappActions.ts`
- `src/lib/actions/smsActions.ts`
- `src/lib/actions/emailActions.ts`
- `src/lib/actions/msg91Actions.ts`
- `src/lib/actions/upload-actions.ts`
- `src/lib/actions/storage-actions.ts`
- `src/lib/actions/school-management-actions.ts`
- `src/lib/actions/billing-actions.ts`
- `src/lib/actions/moduleActions.ts`
- `src/lib/actions/syllabusActions.ts`
- `src/lib/actions/assignmentsActions.ts`
- `src/lib/actions/questionBankActions.ts`
- `src/lib/actions/onlineExamActions.ts`
- `src/lib/actions/leaveApplicationsActions.ts`
- `src/lib/actions/scholarshipActions.ts`
- `src/lib/actions/classesActions.ts`
- `src/lib/actions/subjectsActions.ts`
- `src/lib/actions/sectionsActions.ts`
- `src/lib/actions/academicActions.ts`
- `src/lib/actions/academicyearsActions.ts`
- `src/lib/actions/termsActions.ts`
- `src/lib/actions/roomsActions.ts`
- `src/lib/actions/departmentsAction.ts`

**API routes:**
- `src/app/api/admin/` (all routes)
- `src/app/api/users/` (all routes)
- `src/app/api/r2/` (all routes)
- `src/app/api/reports/` (all routes)
- `src/app/api/permissions/` (all routes)
- `src/app/api/storage/` (all routes)
- `src/app/api/cdn/` (all routes)
- `src/app/api/cron/` (all routes)
- `src/app/api/calendar/export/`, `import/`, `preferences/`, `student-events/`
- `src/app/api/notifications/[id]/route.ts`
- `src/app/api/classes/[id]/route.ts`
