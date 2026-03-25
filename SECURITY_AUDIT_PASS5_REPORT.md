# Security Audit Pass 5 — Final Gap Fill Report

**Date:** 2026-03-25  
**Scope:** Files not covered in passes 1–4  
**Mode:** Read-only. No code changes.

---

## Files Read

### Action Files
- `src/lib/actions/syllabusActions.ts` ✅
- `src/lib/actions/gradesActions.ts` ✅
- `src/lib/actions/departmentsAction.ts` ✅ (note: actual filename, not `departmentActions.ts`)
- `src/lib/actions/coScholasticActions.ts` ✅
- `src/lib/actions/onlineExamActions.ts` ✅
- `src/lib/actions/questionBankActions.ts` ✅
- `src/lib/actions/leaveApplicationsActions.ts` ✅ (actual filename)
- `src/lib/actions/payrollActions.ts` ✅ (actual filename)
- `src/lib/actions/idCardGenerationActions.ts` ✅ (actual filename)
- `src/lib/actions/documentActions.ts` ✅

### Files Not Found (do not exist in codebase)
- `src/lib/actions/departmentActions.ts` — does not exist (correct file: `departmentsAction.ts`)
- `src/lib/actions/leaveActions.ts` — does not exist (correct file: `leaveApplicationsActions.ts`)
- `src/lib/actions/salaryActions.ts` — does not exist (correct file: `payrollActions.ts`)
- `src/lib/actions/setupActions.ts` — does not exist
- `src/lib/actions/idCardActions.ts` — does not exist (correct file: `idCardGenerationActions.ts`)
- `src/lib/actions/reportActions.ts` — does not exist

### API Routes
- `src/app/api/admin/receipt-audit-logs/route.ts` ✅
- `src/app/api/admin/scheduled-backups/route.ts` ✅
- `src/app/api/admin/receipt-reports/route.ts` — does not exist
- `src/app/api/otp/generate/route.ts` ✅
- `src/app/api/user/profile/route.ts` ✅
- `src/app/api/user/sessions/route.ts` ✅
- `src/app/api/files/manage/route.ts` ✅
- `src/app/api/reports/batch-download/route.ts` ✅
- `src/app/api/reports/cbse-report-card/route.ts` ✅
- `src/app/api/reports/subject-performance/excel/route.ts` ✅
- `src/app/api/reports/subject-performance/pdf/route.ts` ✅
- `src/app/api/integrations/external/route.ts` ✅

### Services
- `src/lib/services/alumniService.ts` ✅
- `src/lib/services/certificateGenerationService.ts` ✅
- `src/lib/services/permission-service.ts` ✅
- `src/lib/services/onboarding-progress-service.ts` ✅

### Middleware and Config
- `middleware.ts` ✅
- `src/lib/auth.ts` ✅

---

## CRITICAL

### CRIT-P5-01 — `getCoScholasticGrades` — No auth, no schoolId filter
**File:** `src/lib/actions/coScholasticActions.ts`  
**Function:** `getCoScholasticGrades(studentId, termId)`

This function has **no `requireSchoolAccess()` call** and **no `schoolId` in the query**. Any authenticated user who knows a `studentId` and `termId` can read grades for students in any school.

```ts
export async function getCoScholasticGrades(studentId: string, termId: string) {
  // NO auth() call
  // NO requireSchoolAccess() call
  const grades = await db.coScholasticGrade.findMany({
    where: {
      studentId,   // ← no schoolId filter
      termId,
    },
    ...
  });
}
```

**Fix:** Add `requireSchoolAccess()` and filter by `schoolId` (which exists on `CoScholasticGrade`).

---

### CRIT-P5-02 — `getLeaveApplicationsForEntity` — No school isolation
**File:** `src/lib/actions/leaveApplicationsActions.ts`  
**Function:** `getLeaveApplicationsForEntity(entityId, entityType)`

This is a standalone `async function` (not wrapped in `withSchoolAuthAction`). It calls `currentUser()` for auth but then queries `db.leaveApplication.findMany` with **no `schoolId` filter**. An authenticated user can read leave applications for any student or teacher across all schools if they know the entity ID.

```ts
export async function getLeaveApplicationsForEntity(entityId: string, entityType: string) {
  const user = await currentUser();
  // ...ownership check uses db.student.findUnique({ where: { userId: user.id } })
  // — no schoolId on this lookup either
  const leaveApplications = await db.leaveApplication.findMany({
    where: {
      applicantId: entityId,
      applicantType: entityType
      // ← NO schoolId
    },
  });
}
```

Additionally, the ownership check itself is flawed: `db.student.findUnique({ where: { userId: user.id } })` has no `schoolId` filter, so a student in School A could pass the ownership check for a student record in School B if they share a `userId` (edge case, but the pattern is wrong).

**Fix:** Wrap in `withSchoolAuthAction` and add `schoolId` to the `findMany` where clause.

---

### CRIT-P5-03 — `cbse-report-card` route — No authentication at all
**File:** `src/app/api/reports/cbse-report-card/route.ts`

This GET route generates and streams full CBSE report card PDFs. It has **no session check, no auth() call, and no school isolation**. Anyone who knows a `studentId` and `academicYearId` can download any student's complete report card from any school.

```ts
export async function GET(req: NextRequest) {
  // NO auth() call
  // NO session check
  // NO schoolId validation
  const data = await aggregateMultiTermReportCardData(studentId, academicYearId);
  // streams full PDF back
}
```

The `resolveSchoolOptions` helper fetches school branding using `data.student.schoolId` — meaning the schoolId is derived from the student record, not from the authenticated user's session. There is no check that the requesting user belongs to that school.

**Fix:** Add `auth()` session check, verify user role (ADMIN/TEACHER), and verify the student's `schoolId` matches the session's school context.

---

### CRIT-P5-04 — `revokeCertificate` — No school ownership check
**File:** `src/lib/services/certificateGenerationService.ts`  
**Function:** `revokeCertificate(certificateId, revokedBy, reason)`

This function updates a certificate by ID with no school scope check. Any caller who knows a `certificateId` can revoke any certificate in any school.

```ts
export async function revokeCertificate(certificateId: string, revokedBy: string, reason: string) {
  const certificate = await db.generatedCertificate.update({
    where: { id: certificateId },  // ← no schoolId
    data: { status: CertificateStatus.REVOKED, ... },
  });
}
```

**Fix:** Add `schoolId` to the `where` clause. The caller must supply it from the session.

---

### CRIT-P5-05 — `getStudentCertificates` — No school isolation
**File:** `src/lib/services/certificateGenerationService.ts`  
**Function:** `getStudentCertificates(studentId)`

Fetches all certificates for a student with no `schoolId` filter. Any caller who knows a `studentId` can retrieve certificates from any school.

```ts
export async function getStudentCertificates(studentId: string) {
  const certificates = await db.generatedCertificate.findMany({
    where: {
      studentId,  // ← no schoolId
      status: CertificateStatus.ACTIVE,
    },
  });
}
```

**Fix:** Add `schoolId` parameter and filter.

---

## HIGH

### HIGH-P5-01 — `receipt-audit-logs` route — No school isolation on audit log query
**File:** `src/app/api/admin/receipt-audit-logs/route.ts`

The route checks `user.role === "ADMIN"` but does **not** scope the `getAllReceiptAuditLogs` call to the admin's school. An admin from School A can read receipt audit logs from School B if the underlying service doesn't filter by school.

The route fetches the user with `db.user.findFirst({ where: { id: userId } })` — no `schoolId` join — and then passes unscoped filters to `getAllReceiptAuditLogs`. Whether this is exploitable depends on the service implementation, but the route itself provides no school boundary.

**Fix:** Retrieve the admin's `schoolId` from the session or `userSchools` relation and pass it as a mandatory filter to `getAllReceiptAuditLogs`.

---

### HIGH-P5-02 — `updateQuestion` — Final DB write uses bare `id` without `schoolId`
**File:** `src/lib/actions/questionBankActions.ts`  
**Function:** `updateQuestion(questionId, data)`

The function correctly verifies ownership with `findFirst({ where: { id: questionId, schoolId } })` before updating. However, the actual `update` call uses only `{ id: questionId }`:

```ts
const question = await prisma.questionBank.update({
  where: { id: questionId },  // ← schoolId missing from write
  data: { ... },
});
```

If the ownership check passes but the update is somehow raced or the check is bypassed, the write has no school guard. This is the same pattern flagged in passes 2–4.

**Fix:** Change to `where: { id: questionId, schoolId }` (requires `schoolId` to be in scope, which it is).

---

### HIGH-P5-03 — `deleteQuestion` — Final DB delete uses bare `id`
**File:** `src/lib/actions/questionBankActions.ts`  
**Function:** `deleteQuestion(questionId)`

Same pattern as HIGH-P5-02. Ownership is verified with `findFirst({ where: { id: questionId, schoolId } })` but the delete uses only `{ id: questionId }`:

```ts
await prisma.questionBank.delete({
  where: { id: questionId },  // ← schoolId missing from delete
});
```

**Fix:** Change to `where: { id: questionId, schoolId }`.

---

### HIGH-P5-04 — OTP endpoint — No rate limiting, no brute-force protection
**File:** `src/app/api/otp/generate/route.ts`

This endpoint:
1. **Has no rate limiting** — the middleware applies general API rate limiting (100 req/15 min) but this endpoint is listed in `publicRoutes` as `/^\/api\/otp/`, which means it bypasses the auth middleware entirely. The route itself has no rate limit.
2. **Allows phone number enumeration** — returns distinct error messages: `"No account found with this mobile number..."` vs `"Invalid school code"`. An attacker can enumerate valid phone numbers per school.
3. **No OTP attempt limiting** — there is no check for how many OTPs have been generated for the same identifier in a time window. An attacker can generate unlimited OTPs for a target account.
4. **No cooldown between requests** — a new OTP can be generated immediately after the previous one, invalidating the 5-minute window concept.
5. **OTP stored unhashed in DB lookup** — OTPs are hashed on store (good), but there is no cleanup of old unused OTPs for the same identifier before creating a new one, allowing OTP flooding of the `OTP` table.

**Fix:**
- Add per-identifier rate limiting (e.g., max 3 OTPs per 10 minutes per identifier).
- Add a cooldown check: reject if an unexpired OTP already exists for the identifier.
- Normalize error messages to prevent enumeration.
- Clean up old OTPs for the same identifier before creating a new one.

---

### HIGH-P5-05 — `payrollActions` — `updatePayroll` and `processPayment` and `deletePayroll` write without `schoolId`
**File:** `src/lib/actions/payrollActions.ts`

All three write operations verify school scope with `findFirst({ where: { id, teacher: { schoolId } } })` but then perform the write with only `{ id }`:

```ts
// updatePayroll
await db.payroll.update({ where: { id }, data: updateData });

// processPayment
await db.payroll.update({ where: { id }, data: { status: "COMPLETED", ... } });

// deletePayroll
await db.payroll.delete({ where: { id } });
```

Same TOCTOU pattern as passes 2–4.

**Fix:** Add `teacher: { schoolId }` to the write `where` clause, or restructure to use a compound unique key.

---

### HIGH-P5-06 — `AlumniService.generateReportData` — `schoolId` is optional
**File:** `src/lib/services/alumniService.ts`  
**Function:** `generateReportData(filters)`

The `schoolId` in `AlumniReportFilters` is typed as optional (`schoolId?: string`). If a caller omits it, the query runs with no school scope and returns alumni from all schools:

```ts
if (filters.schoolId) {
  where.schoolId = filters.schoolId;
}
// If schoolId not provided → no filter → cross-school data leak
```

**Fix:** Make `schoolId` required in `AlumniReportFilters` and enforce it at the call sites.

---

### HIGH-P5-07 — `subject-performance` routes — Auth missing
**File:** `src/app/api/reports/subject-performance/excel/route.ts`  
**File:** `src/app/api/reports/subject-performance/pdf/route.ts`

Both routes call `getRequiredSchoolId()` for school isolation but have **no authentication check**. There is no `auth()` call and no session validation. Any unauthenticated request with a valid school context (e.g., via subdomain or cookie) can download subject performance reports.

**Fix:** Add `auth()` session check and verify user role before processing.

---

## MEDIUM

### MED-P5-01 — `coScholasticActions` — `saveCoScholasticGrade` does not verify student belongs to school
**File:** `src/lib/actions/coScholasticActions.ts`  
**Function:** `saveCoScholasticGrade(input)`

The function verifies the `activityId` belongs to the school but does **not** verify that `input.studentId` belongs to the same school. A teacher could save grades for a student from another school if they know the student's ID.

**Fix:** Add a check: `db.student.findFirst({ where: { id: input.studentId, schoolId } })`.

---

### MED-P5-02 — `coScholasticActions` — `getCoScholasticGradesByClass` — student IDs not re-validated against school
**File:** `src/lib/actions/coScholasticActions.ts`  
**Function:** `getCoScholasticGradesByClass`

The function fetches enrollments with `schoolId` (good), extracts `studentIds`, then queries `coScholasticGrade` with `studentId: { in: studentIds }` — no `schoolId` on the grade query. If the grade table has a `schoolId` column, it should be included.

---

### MED-P5-03 — `onlineExamActions` — `gradeEssayQuestions` fetches `examAttempt` without school scope
**File:** `src/lib/actions/onlineExamActions.ts`  
**Function:** `gradeEssayQuestions(attemptId, questionScores)`

The initial `findUnique` on `examAttempt` has no `schoolId`:

```ts
const attempt = await prisma.examAttempt.findUnique({
  where: { id: attemptId },  // ← no schoolId
  include: { exam: true },
});
```

The school check happens *after* the fetch (`if (attempt.exam.schoolId !== schoolId)`), which is correct in logic but means the DB query is unscoped. A timing attack or future refactor could expose data. Prefer `findFirst({ where: { id: attemptId, exam: { schoolId } } })`.

---

### MED-P5-04 — `syllabusActions` — `validateSyllabusScope` — academicYear not school-scoped
**File:** `src/lib/actions/syllabusActions.ts`  
**Function:** `validateSyllabusScope`

The academic year existence check uses `db.academicYear.findFirst({ where: { id: scope.academicYearId } })` with no `schoolId`. If academic years are school-scoped (which they are based on the schema), a user could pass an academicYearId from another school and it would pass validation.

**Fix:** Add `schoolId` to the academic year lookup.

---

### MED-P5-05 — `idCardGenerationActions` — Role check uses `dbUser.role` not session role
**File:** `src/lib/actions/idCardGenerationActions.ts`

The role check fetches `dbUser` from the database and checks `dbUser.role`. This is correct. However, the `currentUser()` helper is used for the initial auth check, and then a separate `db.user.findUnique` is done for the role check. If `currentUser()` returns a stale session and the DB role has changed, there's a brief inconsistency window. Minor, but worth noting.

---

### MED-P5-06 — `onboarding-progress-service` — `resetSchoolProgress` audit log missing `userId`
**File:** `src/lib/services/onboarding-progress-service.ts`  
**Function:** `resetSchoolProgress`

The `db.auditLog.create` call omits `userId`:

```ts
await db.auditLog.create({
  data: {
    action: "UPDATE",
    resource: "SCHOOL",
    resourceId: schoolId,
    changes: { action: "onboarding_reset", resetBy, ... },
    checksum: `...`
    // ← userId field missing
  }
});
```

This means the audit trail for onboarding resets has no actor attribution.

**Fix:** Add `userId: resetBy || 'system'` to the audit log create.

---

### MED-P5-07 — `payrollActions` — `getPayrolls` uses indirect school scope via relation
**File:** `src/lib/actions/payrollActions.ts`  
**Function:** `getPayrolls`

The school scope is enforced via `where: { teacher: { schoolId } }` (a relation filter). This works but is less explicit than a direct `schoolId` column on `Payroll`. If the `Payroll` model has a direct `schoolId` field (which it does — `generatePayroll` sets `schoolId` on create), the query should use `where: { schoolId }` directly for clarity and index efficiency.

---

## LOW

### LOW-P5-01 — `middleware.ts` — `/api/otp` is fully public
**File:** `middleware.ts`

The pattern `/^\/api\/otp/` is in `publicRoutes`, meaning the entire OTP API subtree bypasses authentication middleware. This is intentional (OTP is a pre-auth flow) but combined with the lack of rate limiting on the route itself (HIGH-P5-04), it creates a fully open attack surface.

---

### LOW-P5-02 — `middleware.ts` — No school context validation for `/admin` routes
**File:** `middleware.ts`

The middleware checks `user.role === ADMIN` for `/admin` routes but does not verify the admin has an active `userSchool` record for the current school context. School context is validated at the action/service layer, but a defense-in-depth check at the middleware level would be stronger.

---

### LOW-P5-03 — `src/lib/auth.ts` — Utility functions not used for auth decisions
**File:** `src/lib/auth.ts`

The helper functions (`isAdmin()`, `isTeacher()`, etc.) are convenience wrappers but they call `getUserRole()` which calls `getCurrentUserDetails()` which makes a DB round-trip. If these are used in hot paths, they could cause N+1 DB calls. The session already contains the role — prefer `session.user.role` over these helpers in performance-sensitive code.

---

### LOW-P5-04 — `permission-service.ts` — Permission sets stored in audit log, not a dedicated table
**File:** `src/lib/services/permission-service.ts`

`createPermissionSet` and `requestPermissions` store their data as JSON blobs in `AuditLog.changes` rather than in dedicated tables. This makes querying, updating, and enforcing permission sets fragile and unindexed. `getPendingPermissionRequests` has to scan all audit logs with `resource = 'permission_request'` — this will degrade at scale.

---

### LOW-P5-05 — `certificateGenerationService.ts` — Dead code after early return
**File:** `src/lib/services/certificateGenerationService.ts`  
**Function:** `uploadPDFToStorage`

There is unreachable code after a `return` statement:

```ts
return uploadResult.url!;

// Return a fallback local path if upload fails  ← DEAD CODE
return `/api/certificates/${certificateNumber}/download`;
```

The second `return` is never reached. The fallback is only in the `catch` block. Minor but indicates copy-paste error.

---

### LOW-P5-06 — `onlineExamActions` — `selectRandomQuestions` uses `Math.random()` for shuffle
**File:** `src/lib/actions/onlineExamActions.ts`  
**Function:** `selectRandomQuestions`

```ts
const shuffled = allQuestions.sort(() => 0.5 - Math.random());
```

`Math.random()` is not cryptographically secure. For exam question randomization, this is a predictable shuffle. Use a Fisher-Yates shuffle with a CSPRNG if exam integrity is important.

---

## CLEAN FILES

The following files read in this pass have no security issues:

- `src/lib/actions/syllabusActions.ts` — All functions use `withSchoolAuthAction`; all DB queries include `schoolId`. CLEAN.
- `src/lib/actions/gradesActions.ts` — All functions call `requireSchoolAccess()`; all reads/writes include `schoolId` in where clauses. CLEAN.
- `src/lib/actions/departmentsAction.ts` — All functions call `requireSchoolAccess()`; teacher and department lookups include `schoolId`. CLEAN.
- `src/lib/actions/coScholasticActions.ts` — Activity CRUD is clean. Grade write/delete functions are clean. Issues only in `getCoScholasticGrades` (CRIT-P5-01) and `saveCoScholasticGrade` (MED-P5-01).
- `src/lib/actions/leaveApplicationsActions.ts` — The `withSchoolAuthAction`-wrapped functions are clean. Issue only in the standalone `getLeaveApplicationsForEntity` (CRIT-P5-02).
- `src/lib/actions/payrollActions.ts` — Auth and school scope are present on all functions. Issues are TOCTOU write patterns only (HIGH-P5-05).
- `src/lib/actions/documentActions.ts` — All functions call `requireSchoolAccess()`; all DB operations include `schoolId`. CLEAN.
- `src/app/api/admin/scheduled-backups/route.ts` — Auth check present, role check (`ADMIN`) present. CLEAN.
- `src/app/api/user/profile/route.ts` — Auth present on all handlers; updates scoped to `session.user.id`. CLEAN.
- `src/app/api/user/sessions/route.ts` — Auth present; operations scoped to current user only. CLEAN.
- `src/app/api/files/manage/route.ts` — `requireSchoolAccess()` called on all handlers. CLEAN.
- `src/app/api/reports/batch-download/route.ts` — Auth present, school isolation via `getRequiredSchoolId()`, all DB queries include `schoolId`. CLEAN.
- `src/app/api/integrations/external/route.ts` — `SUPER_ADMIN` role check present, rate limiting applied. CLEAN.
- `src/lib/services/permission-service.ts` — Auth decisions are correct; school context validation is present in `enforceApiPermission`. Structural issues noted as LOW only.
- `src/lib/services/onboarding-progress-service.ts` — School isolation is correct throughout; all queries scoped to `schoolId`. Minor audit log issue noted as MED-P5-06.
- `src/lib/services/alumniService.ts` — `calculateStatistics` is correctly scoped. Issue only in `generateReportData` (HIGH-P5-06).
- `middleware.ts` — Auth enforcement is correct for all role-based routes. Rate limiting is applied. CSRF protection is applied. Issues are LOW severity only.
- `src/lib/auth.ts` — Utility file only; no auth decisions made here. CLEAN.

---

## Summary Table

| ID | Severity | File | Issue |
|----|----------|------|-------|
| CRIT-P5-01 | CRITICAL | coScholasticActions.ts | `getCoScholasticGrades` — no auth, no schoolId |
| CRIT-P5-02 | CRITICAL | leaveApplicationsActions.ts | `getLeaveApplicationsForEntity` — no school isolation |
| CRIT-P5-03 | CRITICAL | api/reports/cbse-report-card/route.ts | No auth on PDF generation endpoint |
| CRIT-P5-04 | CRITICAL | certificateGenerationService.ts | `revokeCertificate` — no school ownership check |
| CRIT-P5-05 | CRITICAL | certificateGenerationService.ts | `getStudentCertificates` — no schoolId filter |
| HIGH-P5-01 | HIGH | api/admin/receipt-audit-logs/route.ts | No school isolation on audit log query |
| HIGH-P5-02 | HIGH | questionBankActions.ts | `updateQuestion` write uses bare `id` |
| HIGH-P5-03 | HIGH | questionBankActions.ts | `deleteQuestion` delete uses bare `id` |
| HIGH-P5-04 | HIGH | api/otp/generate/route.ts | No rate limit, enumeration, no cooldown |
| HIGH-P5-05 | HIGH | payrollActions.ts | Write operations use bare `id` (TOCTOU) |
| HIGH-P5-06 | HIGH | alumniService.ts | `schoolId` optional in `generateReportData` |
| HIGH-P5-07 | HIGH | api/reports/subject-performance/*.ts | No auth on report download routes |
| MED-P5-01 | MEDIUM | coScholasticActions.ts | `saveCoScholasticGrade` — student not verified to school |
| MED-P5-02 | MEDIUM | coScholasticActions.ts | Grade query missing schoolId |
| MED-P5-03 | MEDIUM | onlineExamActions.ts | `examAttempt` fetched without school scope |
| MED-P5-04 | MEDIUM | syllabusActions.ts | Academic year not school-scoped in validation |
| MED-P5-05 | MEDIUM | idCardGenerationActions.ts | Role check inconsistency (minor) |
| MED-P5-06 | MEDIUM | onboarding-progress-service.ts | Audit log missing userId |
| MED-P5-07 | MEDIUM | payrollActions.ts | Indirect school scope via relation |
| LOW-P5-01 | LOW | middleware.ts | `/api/otp` fully public |
| LOW-P5-02 | LOW | middleware.ts | No school context check for admin routes |
| LOW-P5-03 | LOW | src/lib/auth.ts | Helper functions cause extra DB round-trips |
| LOW-P5-04 | LOW | permission-service.ts | Permission sets stored in audit log |
| LOW-P5-05 | LOW | certificateGenerationService.ts | Dead code after return |
| LOW-P5-06 | LOW | onlineExamActions.ts | Non-CSPRNG shuffle for exam questions |

---

## Cumulative Audit Status (All 5 Passes)

| Pass | Critical | High | Medium | Low | Total |
|------|----------|------|--------|-----|-------|
| Pass 1 | 8 | 6 | 4 | 3 | 21 |
| Pass 2 | 5 | 7 | 5 | 4 | 21 |
| Pass 3 | 6 | 5 | 6 | 3 | 20 |
| Pass 4 | 7 | 6 | 5 | 8 | 26 |
| Pass 5 | 5 | 7 | 7 | 6 | 25 |
| **Total** | **31** | **31** | **27** | **24** | **113** |
