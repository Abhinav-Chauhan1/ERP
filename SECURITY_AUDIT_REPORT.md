# SikshaMitra ERP — Security, Performance & Code Quality Audit Report

**Date**: March 23, 2026  
**Scope**: Read-only audit. No code changes made.  
**Coverage**: ~30 action files, ~10 API routes, middleware, auth layer, key services  
**Note**: Files not read are listed in the "Audit Coverage" section at the end. Findings are limited to files actually inspected.

---

## CRITICAL

### C-1: Unauthenticated Server Actions — `marksEntryActions.ts`

**File**: `src/lib/actions/marksEntryActions.ts`  
**Functions**: `getClassesForMarksEntry()`, `getExamsForMarksEntry()`, `getSubjectsForMarksEntry()`, `getTermsForMarksEntry()`, `getExamTypesForMarksEntry()`, `getEnrolledStudentsForMarks()`, `getMarksAuditLogs()`

These functions call `db.*` directly with **no `auth()` call, no `requireSchoolAccess()`, no `withSchoolAuthAction` wrapper**. They are completely unauthenticated server actions. Any user — including unauthenticated visitors — can invoke them.

Additionally, none of these queries include a `schoolId` filter, so they return data from **all schools** in the database.

**Attack vector**: An unauthenticated HTTP client can call these server actions and receive the full list of classes, exams, subjects, students, and audit logs from every school in the system.

---

### C-2: Cross-School Data Leakage — `parent-actions.ts`

**File**: `src/lib/actions/parent-actions.ts`  
**Functions**: `getParentDashboardData()`, `getChildAcademicPerformance()`

- `db.announcement.findMany()` — **no `schoolId` filter** — returns announcements from all schools
- `db.feePayment.findMany()` — **no `schoolId` filter** — returns fee payments for the student IDs regardless of school
- `db.studentAttendance.findMany()` — **no `schoolId` filter**
- `db.examResult.findMany()`, `db.assignmentSubmission.findMany()`, `db.reportCard.findMany()` in `getChildAcademicPerformance()` — **no `schoolId` filter**

The function uses `currentUser()` from auth-helpers but **never calls `requireSchoolAccess()`**, so there is no school context enforced. A parent whose children are enrolled in School A can see announcements, fee payments, and academic data from School B.

---

### C-3: Cross-School Data Leakage — `marksEntryActions.ts` (Data Isolation)

**File**: `src/lib/actions/marksEntryActions.ts`  
**Functions**: `getClassesForMarksEntry()`, `getExamsForMarksEntry()`, `getSubjectsForMarksEntry()`, `getTermsForMarksEntry()`, `getExamTypesForMarksEntry()`, `getEnrolledStudentsForMarks()`

All of these queries have **no `schoolId` filter**. A teacher from School A would see classes, exams, subjects, and students from School B. Combined with C-1 (no auth), this is a full data dump endpoint.

---

### C-4: Cross-School Data Leakage — Fee Services

**Files**: `src/lib/services/fee-type-service.ts`, `src/lib/services/fee-structure-service.ts`, `src/lib/actions/feeStructureActions.ts`

- `getFeeTypes()` — `db.feeType.findMany()` with **no `schoolId` filter**
- `getFeeTypeById()` — `db.feeType.findUnique()` with **no `schoolId` filter**
- `getFeeTypesWithClassAmountInfo()` — **no `schoolId` filter**
- `getAmountForClass()` — **no `schoolId` filter**
- `getTemplates()` in fee-structure-service — `db.feeStructure.findMany({ where: { isTemplate: true } })` — **no `schoolId` filter**, returns templates from all schools
- `getFeeStructuresForClass()` — **no `schoolId` filter**
- `autoGenerateFeeTypes()` — `db.feeType.findMany({ select: { name: true } })` — **no `schoolId` filter**, checks names globally, so School A's fee type names suppress creation in School B

All of these are called from `feeStructureActions.ts` which passes no `schoolId` to the service layer.

---

### C-5: Wrong Field Used in DB Query — `parent-fee-actions.ts`

**File**: `src/lib/actions/parent-fee-actions.ts`  
**Function**: `downloadReceipt()`

```typescript
const schoolSettings = await db.schoolSettings.findFirst({
  where: { id: (parent as any).schoolId }  // BUG: uses `id` field, should be `schoolId`
});
```

The query filters `SchoolSettings` by `id` using the value of `schoolId`. This will never find the correct settings record (unless by coincidence the IDs match). The receipt download will silently use null/undefined school settings, potentially generating receipts with missing school branding/info.

---

### C-6: Client-Supplied `schoolId` in `scheduleParentTeacherMeeting()`

**File**: `src/lib/actions/parent-actions.ts`  
**Function**: `scheduleParentTeacherMeeting()`

The function accepts `schoolId` as a parameter from the caller and uses it directly in `db.parentTeacherMeeting.create({ data: { schoolId, ... } })`. A malicious client can supply any `schoolId` and create meeting records attributed to a different school.

---

### C-7: Self-Registration as ADMIN — `register` API Route

**File**: `src/app/api/auth/register/route.ts`

The registration endpoint accepts a `role` field from the request body and passes it directly to `db.user.create()`. The only validation is that the role is a valid `UserRole` enum value — which includes `ADMIN`, `TEACHER`, `PARENT`, `STUDENT`. There is no restriction preventing a user from self-registering as `ADMIN`.

No Zod schema is used; validation is manual and incomplete.

---

### C-8: Cross-School Data Leakage — `reportCardsActions.ts`

**File**: `src/lib/actions/reportCardsActions.ts`  
**Functions**: `getReportCards()`, `getStudentsForReportCard()`, `getReportCardFilters()`, `calculateClassRanks()`, `updateReportCardRemarks()`, `publishReportCard()`

None of these functions call `requireSchoolAccess()` or `withSchoolAuthAction`. They have **no `schoolId` filter** on any query:

- `getReportCards()` — `db.reportCard.findMany({ where: {} })` — returns all report cards from all schools
- `getStudentsForReportCard()` — `db.student.findMany()` — returns all students from all schools
- `getReportCardFilters()` — `db.term.findMany()`, `db.class.findMany()`, `db.classSection.findMany()` — all schools
- `calculateClassRanks()` — `db.reportCard.findMany({ where: { termId, student: { enrollments: ... } } })` — no schoolId, can rank students across schools
- `updateReportCardRemarks()` — `db.reportCard.update({ where: { id } })` — no ownership check, any authenticated user can update any report card
- `publishReportCard()` — `db.reportCard.findUnique({ where: { id } })` — no schoolId check, any user can publish any school's report card

---

### C-9: Cross-School Data Leakage — `messageActions.ts` `getContacts()`

**File**: `src/lib/actions/messageActions.ts`  
**Function**: `getContacts()`

```typescript
const users = await db.user.findMany({
  where: { id: { not: dbUser.id }, isActive: true },
  ...
});
```

**No `schoolId` filter**. Returns all active users from all schools. A teacher in School A can see and message users from School B.

Also, `getMessages()` fetches messages by `recipientId`/`senderId` only — no `schoolId` filter — but this is lower risk since messages are user-scoped.

---

### C-10: Cross-School Data Leakage — `parent-children-actions.ts` N+1 + Missing schoolId

**File**: `src/lib/actions/parent-children-actions.ts`  
**Function**: `getMyChildren()` → `enrichedChildren` loop

Inside `Promise.all(map)` per child:
- `db.studentAttendance.findMany({ where: { studentId } })` — **no `schoolId` filter**
- `db.subjectClass.findMany({ where: { classId } })` — **no `schoolId` filter**

---

## HIGH

### H-1: Fee Payment Cross-School Validation Missing

**File**: `src/lib/actions/parent-fee-actions.ts`  
**Functions**: `createPayment()`, `verifyPayment()`

Both functions accept `feeStructureId` from the client. While they verify the fee structure exists and is active, they do **not verify the fee structure belongs to the parent's school**. A parent from School A could supply a `feeStructureId` from School B and create a payment record against it.

---

### H-2: CSRF Bypass — All API Routes Explicitly Skipped

**File**: `src/lib/middleware/csrf-protection.ts`

The `skipPaths` array explicitly bypasses CSRF for:
```
'/api/super-admin/', '/api/admin/', '/api/teacher/', '/api/student/',
'/api/students/', '/api/parent/', '/api/parents/'
```

This means **all authenticated API routes are exempt from CSRF protection**. The comment says "these routes use session authentication" but session cookies are still vulnerable to CSRF. The only routes that actually get CSRF protection are a narrow set of non-API paths.

This is a design decision that significantly weakens CSRF protection. If any of these routes perform state-changing operations (which they do), they are CSRF-vulnerable.

---

### H-3: R2 File Retrieval — No School Ownership Validation on File Keys

**File**: `src/app/api/r2/files/route.ts`

The `GET` endpoint calls `fileManager.retrieveFile(params.key, ...)` and `fileManager.getFileMetadata(key)` using a key supplied directly from the query string. While `requireSchoolAccess()` is called, the file key is not validated to belong to the current school. If file keys are guessable or leaked, a user from School A can retrieve files belonging to School B.

The `DELETE` endpoint does pass `schoolId` to `r2StorageService.deleteFile(schoolId, key)` — this is correct — but the GET path does not enforce the same check.

---

### H-4: Teacher Document API — No School Isolation

**File**: `src/app/api/teacher/documents/[id]/route.ts`

The document lookup is:
```typescript
const document = await db.document.findUnique({ where: { id } });
```

There is no `schoolId` filter. The ownership check (`document.userId !== user.id`) only prevents accessing another user's documents, but does not enforce school isolation. If the `Document` model has a `schoolId` field, it is not being used here.

---

### H-5: Bulk Import — Class/Section Ownership Not Validated

**File**: `src/lib/actions/bulkImportActions.ts`  
**Function**: `importStudents()`

```typescript
const classExists = await db.class.findUnique({ where: { id: classId } });
const sectionExists = await db.classSection.findUnique({ where: { id: sectionId } });
```

Neither query includes `schoolId`. An admin from School A could supply a `classId` from School B and enroll students into that school's class. The `schoolId` is correctly set on the student and enrollment records, but the class/section ownership is not validated.

---

### H-6: `getAvailableSubjectTemplates()` — No School Isolation

**File**: `src/lib/actions/subjectsActions.ts`  
**Function**: `getAvailableSubjectTemplates()`

```typescript
const existingSubjects = await db.subject.findMany({ select: { code: true } });
```

No `schoolId` filter. This checks subject codes globally across all schools. If School B has a subject with code `MATH`, School A's admin will be told that template is "already created" and won't be offered it. This is a data leakage and functional correctness issue.

---

### H-7: Rate Limiting Falls Back to In-Memory in Production

**File**: `src/lib/middleware/rate-limit.ts`

The code explicitly logs `🚨 CRITICAL: Redis not configured for rate limiting in production!` but still falls back to in-memory rate limiting. In-memory rate limiting is per-process and does not work across multiple server instances (e.g., Vercel serverless functions). If `REDIS_URL` is not configured, rate limiting is effectively disabled in a multi-instance deployment.

---

### H-8: `duplicateFeeStructure()` / `createFromTemplate()` — No `schoolId` Passed

**File**: `src/lib/services/fee-structure-service.ts`  
**Functions**: `duplicateFeeStructure()`, `createFromTemplate()`

Both call `createFeeStructure()` without passing `schoolId`. The duplicated/template-created fee structure will have a null or incorrect `schoolId`, breaking school isolation for fee structures.

---

## MEDIUM

### M-1: N+1 Queries — `parent-children-actions.ts`

**File**: `src/lib/actions/parent-children-actions.ts`  
**Function**: `getMyChildren()`

The `enrichedChildren` block runs `Promise.all(children.map(...))` where each iteration executes:
- `db.subjectClass.findMany({ where: { classId } })`
- `db.studentAttendance.findMany({ where: { studentId } })`

For a parent with 3 children, this is 6 extra queries. These should be batched with `classId: { in: [...] }` and `studentId: { in: [...] }`.

---

### M-2: N+1 Queries — `parent-fee-actions.ts`

**File**: `src/lib/actions/parent-fee-actions.ts`  
**Functions**: `getFeeOverview()`, `downloadReceipt()`

`getFeeAmountForClass(feeItem.feeTypeId, classId)` is called inside `Promise.all(feeItems.map(...))`. Each call executes 2 DB queries. For a student with 10 fee items, this is 20 queries. Should be batched.

---

### M-3: N+1 Queries — `payrollActions.ts`

**File**: `src/lib/actions/payrollActions.ts`  
**Function**: `bulkGeneratePayrolls()`

Creates payrolls in a `for` loop with individual `db.payroll.create()` calls. Should use `db.payroll.createMany()`.

---

### M-4: Unbounded Queries — `students` API Route

**File**: `src/app/api/students/route.ts`

`db.student.findMany()` with no `take` limit. In a school with thousands of students, this returns the entire table in one query. No pagination is implemented.

---

### M-5: Unbounded Queries — `parent-actions.ts`

**File**: `src/lib/actions/parent-actions.ts`  
**Function**: `getParentDashboardData()`

`db.feePayment.findMany()` and `db.studentAttendance.findMany()` have no `take` limit. A student with years of attendance records will cause this to fetch thousands of rows.

---

### M-6: Unbounded Queries — `marksEntryActions.ts`

**File**: `src/lib/actions/marksEntryActions.ts`

`getClassesForMarksEntry()`, `getExamsForMarksEntry()`, `getSubjectsForMarksEntry()` — all unbounded with no `take` limit.

---

### M-7: Over-fetching — `reportCardsActions.ts`

**File**: `src/lib/actions/reportCardsActions.ts`  
**Functions**: `getReportCards()`, `getReportCardById()`

`getReportCards()` uses `include` with full nested objects (student → user, enrollments → class/section, term → academicYear) instead of `.select()` with only needed fields.

`getReportCardById()` fetches the report card twice — once to get `studentId`, then again with full includes. The second query could use the `studentId` from the first, but the double-fetch is unnecessary; a single query with the `id` and a nested `where` on results would suffice.

---

### M-8: Sequential Awaits — `parent-actions.ts`

**File**: `src/lib/actions/parent-actions.ts`  
**Function**: `getParentDashboardData()`

Multiple independent DB queries are awaited sequentially (meetings, announcements, fee payments, attendance). These should be wrapped in `Promise.all()`.

---

### M-9: `batchPublishReportCards()` — Sequential Loop

**File**: `src/lib/actions/reportCardsActions.ts`  
**Function**: `batchPublishReportCards()`

Calls `publishReportCard()` in a `for` loop sequentially. Each `publishReportCard()` call does multiple DB queries and sends emails. For 100 report cards, this is extremely slow. Should use `Promise.all()` with concurrency limiting, or a background job.

---

### M-10: `calculateClassRanks()` — N+1 Update Loop

**File**: `src/lib/actions/reportCardsActions.ts`  
**Function**: `calculateClassRanks()`

```typescript
for (let i = 0; i < reportCards.length; i++) {
  await db.reportCard.update({ where: { id: reportCards[i].id }, data: { rank: i + 1 } });
}
```

One `UPDATE` per report card. For a class of 60 students, this is 60 sequential DB writes. Should use a transaction with `updateMany` or a raw SQL `CASE` statement.

---

### M-11: `publishReportCard()` — Notification Loop N+1

**File**: `src/lib/actions/reportCardsActions.ts`  
**Function**: `publishReportCard()`

Creates one `db.notification.create()` per parent in a `for...of` loop. Should use `db.notification.createMany()`.

---

### M-12: Auth Pattern Inconsistency

Multiple auth patterns are used across the codebase:

1. `withSchoolAuthAction` wrapper (correct — used in `examsActions.ts`, `classesActions.ts`, `subjectsActions.ts`)
2. `requireSchoolAccess()` direct call (correct — used in `classesActions.ts` standalone functions)
3. `currentUser()` only, no school context (incorrect — `parent-actions.ts`, `messageActions.ts`)
4. No auth at all (critical — `marksEntryActions.ts` read functions, `reportCardsActions.ts`)

This inconsistency makes it easy to miss auth checks when adding new functions.

---

### M-13: `getMessages()` — No School Isolation on Message Fetch

**File**: `src/lib/actions/messageActions.ts`  
**Function**: `getMessages()`

Messages are fetched by `recipientId`/`senderId` only. If the `Message` model has a `schoolId` field, it is not being used. A user who is transferred between schools would see messages from their previous school.

---

## LOW

### L-1: R2 Upload — No MIME Type / Magic Number Validation

**File**: `src/app/api/r2/upload/route.ts`

Only file size is validated. No MIME type check and no magic number (file signature) validation. The `/api/upload/route.ts` does have magic number validation via `validateFileUploadSecure`, but the R2 direct upload route does not. An attacker could upload a PHP/HTML file with a `.jpg` extension.

---

### L-2: `getAdministratorWithDetails()` — Dynamic Import Pattern

**File**: `src/lib/actions/administratorActions.ts`

Uses `await import('@/lib/utils/school-context-helper')` inside the function body. This is a dynamic import that runs on every call. While it works, it's an unusual pattern that adds latency and makes the dependency graph harder to trace. Should be a top-level import.

---

### L-3: `reportCardsActions.ts` — Dynamic Imports Inside Functions

**File**: `src/lib/actions/reportCardsActions.ts`

Multiple functions use `await import(...)` inside the function body:
- `generateReportCard()` — `await import("@/lib/services/report-card-data-aggregation")`
- `createReportCard()` — `await import('@/lib/utils/school-context-helper')`
- `publishReportCard()` — `await import('@/lib/utils/school-context-helper')`, `await import('@/lib/services/email-service')`

These should be top-level imports. Dynamic imports inside functions prevent tree-shaking and add per-call overhead.

---

### L-4: `getAvailableSubjectTemplates()` — No Auth Check

**File**: `src/lib/actions/subjectsActions.ts`  
**Function**: `getAvailableSubjectTemplates()`

No `auth()` or `requireSchoolAccess()` call. Any unauthenticated user can call this to enumerate subject codes that exist in the system. Low severity since subject codes are not sensitive, but it's an inconsistency.

---

### L-5: `parent-actions.ts` and `parent-children-actions.ts` — Duplicated `getCurrentParent()` Helper

Both files define a local `getCurrentParent()` helper function. This should be extracted to a shared utility.

---

### L-6: `classesActions.ts` — `checkPermission()` Calls `auth()` Redundantly

**File**: `src/lib/actions/classesActions.ts`

The `checkPermission()` helper calls `auth()` internally. Functions wrapped with `withSchoolAuthAction` already have the session resolved. The double `auth()` call is redundant and adds a DB/session lookup on every permission check.

---

### L-7: `bulkImportActions.ts` — Weak Default Passwords

**File**: `src/lib/actions/bulkImportActions.ts`

Imported users get a default password of `{firstName.toLowerCase()}@123`. This is predictable and weak. The system should either:
- Force password reset on first login
- Generate a cryptographically random temporary password
- Send a password setup email

---

### L-8: Rate Limit — User Agent Included in Client ID

**File**: `src/lib/middleware/rate-limit.ts`  
**Function**: `getClientId()`

The client ID includes the first 50 characters of the User-Agent string. An attacker can trivially bypass IP-based rate limiting by rotating User-Agent strings. The rate limit key should be IP-only (or IP + authenticated user ID for authenticated routes).

---

### L-9: CSRF — Server Actions Bypass via `multipart/form-data`

**File**: `src/lib/middleware/csrf-protection.ts`

```typescript
const isServerAction = request.headers.get('next-action') !== null ||
  request.headers.get('content-type')?.includes('multipart/form-data') || ...
```

Any request with `Content-Type: multipart/form-data` bypasses CSRF validation, even if it's not a Next.js Server Action. An attacker could craft a cross-origin form submission with `multipart/form-data` encoding to bypass CSRF on any endpoint that accepts it.

---

### L-10: `messageActions.ts` — `replyToMessage()` No Ownership Check on Original Message

**File**: `src/lib/actions/messageActions.ts`  
**Function**: `replyToMessage()`

The function fetches the original message by ID but does not verify the current user is the recipient of that message before replying. Any authenticated user can reply to any message if they know the message ID.

---

## STATISTICS

| Severity | Count |
|----------|-------|
| CRITICAL | 10 |
| HIGH | 8 |
| MEDIUM | 13 |
| LOW | 10 |
| **Total** | **41** |

**Most impacted areas**:
- Multi-tenant school isolation: 15 findings (C-1 through C-10, H-1, H-5, H-6, H-8, M-13)
- Authentication/authorization: 5 findings (C-1, C-7, H-2, L-4, L-10)
- Performance (N+1, unbounded queries): 10 findings (M-1 through M-11)
- Code quality/consistency: 6 findings (M-12, L-2 through L-8)

---

## Audit Coverage

**Files read** (~40 files):
- `middleware.ts`, `src/auth.ts`
- `src/lib/auth/tenant.ts`, `src/lib/auth/security-wrapper.ts`, `src/lib/auth-helpers.ts`
- `src/lib/actions/` — payrollActions, feeStructureActions, feePaymentActions, studentActions, teacherActions, userActions, admissionActions, parent-actions, parent-children-actions, parent-fee-actions, announcementActions, marksEntryActions, attendanceActions, scholarshipActions, billing-actions, school-management-actions, examsActions, reportCardsActions, classesActions, subjectsActions, administratorActions, messageActions, bulkImportActions
- `src/lib/services/fee-type-service.ts`, `src/lib/services/fee-structure-service.ts`
- `src/lib/middleware/csrf-protection.ts`, `src/lib/middleware/rate-limit.ts`
- `src/app/api/r2/upload/route.ts`, `src/app/api/r2/presigned-url/route.ts`, `src/app/api/r2/files/route.ts`
- `src/app/api/upload/route.ts`, `src/app/api/auth/register/route.ts`
- `src/app/api/students/route.ts`, `src/app/api/students/[id]/route.ts`
- `src/app/api/teacher/documents/[id]/route.ts`

**Files NOT read** (findings may exist):
- `src/lib/actions/hostelActions.ts`, `lmsActions.ts`, `libraryActions.ts`, `timetableActions.ts`, `eventActions.ts`, `notificationActions.ts`, `alumniActions.ts`
- `src/app/api/parent/` routes, `src/app/api/student/` routes, `src/app/api/teacher/` (other routes)
- `src/app/api/notifications/`, `src/app/api/search/`, `src/app/api/calendar/`
- `src/app/admin/`, `src/app/teacher/`, `src/app/student/`, `src/app/parent/` — server components
- Most of `src/lib/services/` beyond fee services
- `src/lib/actions/timetableTopicActions.ts`, `transportAttendanceActions.ts`, `vehicleActions.ts`, `routeActions.ts`
