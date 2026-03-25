# SikshaMitra — Security Audit Pass 2 Report

**Date**: 2026-03-23  
**Scope**: Files NOT covered in Pass 1 (43 files across actions, API routes, services, layouts/pages)  
**Type**: Read-only audit — no code changes made  
**Pass 1 note**: All Pass 1 findings are assumed fixed and are NOT repeated here.

---

## CRITICAL

These are functions with **zero auth** and/or **zero schoolId filter** — effectively public endpoints.

---

### C1 — `src/lib/actions/hostelActions.ts` — `allocateRoom()`
`roomId` fetched via `db.hostelRoom.findUnique({ where: { id: data.roomId } })` with no `schoolId` filter.  
`existingAllocation` check on `studentId` also has no `schoolId` filter.  
An attacker can supply a `roomId` from another school and allocate a student into it.

### C2 — `src/lib/actions/hostelActions.ts` — `vacateRoom()`
`allocationId` fetched via `db.hostelRoomAllocation.findUnique({ where: { id: allocationId } })` — no `schoolId` filter.  
Any authenticated user can vacate any school's room allocation.

### C3 — `src/lib/actions/hostelActions.ts` — `getRoomAllocations()`
**No `auth()` call at all.** No `schoolId` filter. Accepts a `roomId` and returns all allocations for that room across all schools.

### C4 — `src/lib/actions/hostelActions.ts` — `getStudentAllocation()`
**No `auth()` call at all.** No `schoolId` filter. Accepts a `studentId` and returns the student's active hostel allocation — publicly accessible.

### C5 — `src/lib/actions/hostelActions.ts` — `getVisitors()`
**No `auth()` call at all.** No `schoolId` filter. Returns visitor logs for any student across all schools.

### C6 — `src/lib/actions/hostelActions.ts` — `updateComplaintStatus()`
Uses `auth()` (session check only). The `db.hostelComplaint.update({ where: { id: complaintId } })` has **no `schoolId` filter** — any authenticated user from any school can update any complaint's status.

### C7 — `src/lib/actions/hostelActions.ts` — `getHostelComplaints()`
**No `auth()` call at all.** No `schoolId` filter. Returns complaints across all schools.

### C8 — `src/lib/actions/hostelActions.ts` — `getComplaintById()`
**No `auth()` call at all.** No `schoolId` filter. Returns full complaint detail including student PII for any complaint ID.

### C9 — `src/lib/actions/lmsActions.ts` — `getDiscussions()`
**No `auth()` call at all.** No `schoolId` filter. Accepts a `courseId` and returns all discussions — publicly accessible.

### C10 — `src/lib/actions/lmsActions.ts` — `getQuizAttempts()`
Uses `auth()` but fetches student via `db.student.findUnique({ where: { userId } })` — no `schoolId` filter. The `quizId` query also has no `schoolId` filter. A student from School A can read quiz attempts from School B.

### C11 — `src/lib/actions/libraryActions.ts` — `getBookIssueById()`
**No `auth()` call at all.** No `schoolId` filter. Returns full book issue record including student details for any issue ID.

### C12 — `src/lib/actions/libraryActions.ts` — `createBookReservation()`
Fetches `book` and `student` via `findUnique` — **no `schoolId` filter on either**. A student from School A can reserve a book belonging to School B.

### C13 — `src/lib/actions/timetableActions.ts` — `getClassesForTimetable()`
Uses `auth()` session check only. `db.class.findMany` has **no `schoolId` filter** — returns classes from ALL schools.

### C14 — `src/lib/actions/timetableActions.ts` — `getSubjectTeachersForTimetable()`
Uses `auth()` session check only. `db.subjectTeacher.findMany` has **no `schoolId` filter** — returns subject-teacher combinations from ALL schools.

### C15 — `src/lib/actions/eventActions.ts` — `removeParticipant()`
**No `auth()` call at all.** No `schoolId` filter. Any caller can remove any participant from any event.

### C16 — `src/lib/actions/eventActions.ts` — `markAttendance()`
**No `auth()` call at all.** No `schoolId` filter. Any caller can mark attendance for any event participant.

### C17 — `src/lib/actions/notificationActions.ts` — `createNotification()` (broadcast path)
`db.user.findMany({ where: { role: data.recipientRole } })` — **no `schoolId` filter**. Broadcasts notifications to users across ALL schools.

### C18 — `src/lib/actions/notificationActions.ts` — `getUsersForNotifications()`
`db.user.findMany` has **no `schoolId` filter** — returns users from all schools.

### C19 — `src/lib/actions/alumniActions.ts` — `updateAlumniProfile()`
`db.alumni.findUnique({ where: { id: alumniId } })` — **no `schoolId` filter**. Any ADMIN from any school can update any alumni record.

### C20 — `src/lib/actions/alumniActions.ts` — `getAlumniStatistics()`
Delegates to `alumniService.calculateStatistics()` with no `schoolId` passed. Statistics are cross-school.

### C21 — `src/lib/actions/alumniActions.ts` — `exportAlumniDirectory()`
`db.alumni.findMany({ where })` — the `where` clause built by `alumniService.buildSearchQuery()` does **not include `schoolId`**. Exports alumni from ALL schools.

### C22 — `src/lib/actions/alumniActions.ts` — `sendAlumniMessage()`
`db.alumni.findMany({ where: { id: { in: alumniIds } } })` — **no `schoolId` filter**. An admin from School A can send messages to alumni of School B.

### C23 — `src/lib/actions/alumniActions.ts` — `getAlumniForCommunication()`
`db.alumni.findMany({ where })` — `where` built by `buildSearchQuery()` without `schoolId`. Returns alumni from all schools.

### C24 — `src/app/api/student/achievements/route.ts` — `GET`
**No auth check at all.** Calls `getStudentAchievements(studentId)` directly. Any unauthenticated caller can read any student's achievements by passing a `studentId` query param.

### C25 — `src/app/api/student/notes/route.ts` — `GET` and `POST`
**No auth check at all.** Calls `getStudentNotes`, `searchStudentNotes`, `createStudentNote` directly. Unauthenticated read/write access to student notes.

### C26 — `src/app/api/student/lessons/route.ts` — `GET`
**No auth check at all.** Calls lesson content actions directly. Unauthenticated access to lesson content.

### C27 — `src/app/api/student/flashcards/route.ts` — `GET` and `POST`
**No auth check at all.** Unauthenticated read/write access to flashcard decks.

### C28 — `src/app/api/student/mindmaps/route.ts` — `GET` and `POST`
**No auth check at all.** Unauthenticated read/write access to mind maps.

### C29 — `src/app/api/calendar/categories/route.ts` — `GET` and `POST`
`getAllEventCategories()` called without `schoolId` — returns categories from all schools. `POST` creates a category without scoping to the current school.

---

## HIGH

---

### H1 — `src/lib/actions/hostelActions.ts` — `recordHostelFeePayment()`
Null-check order is inverted: `fee.allocation.schoolId !== schoolId` is evaluated before `if (!fee)`. If `fee` is null this throws instead of returning a clean error. The ownership check itself is correct but the guard ordering is a logic bug that can mask the real error path.

### H2 — `src/lib/actions/lmsActions.ts` — `updateCourseProgress()` (internal helper)
`db.enrollment.findUnique({ where: { id: enrollmentId } })` — no `schoolId` filter. Called from `updateLessonProgress` which is authenticated, but the helper itself is unguarded and could be called from other paths without the schoolId check.

### H3 — `src/lib/actions/timetableActions.ts` — `updateTimetableSlot()` conflict helpers
`checkSlotConflict()`, `checkTeacherAvailability()`, `checkRoomAvailability()` query by `timetableId` only with no `schoolId` guard. A crafted `timetableId` from another school passed to `updateTimetableSlot` could leak slot/teacher/room data from that school via conflict-check responses.

### H4 — `src/lib/actions/notificationActions.ts` — `sendBulkNotifications()`
Creates only a single notification record for `userId: dbUser.id` (the sender) instead of iterating over the intended bulk recipients. Bulk send silently fails — no notifications are delivered to the target audience. This is both a functional bug and a security concern (audit trail shows send succeeded when it did not).

### H5 — `src/app/api/webhooks/msg91/route.ts` — no mandatory signature verification
No HMAC signature verification. The implementation only checks an optional query-param token (`MSG91_WEBHOOK_TOKEN`) and optional IP whitelist (`MSG91_WEBHOOK_IPS`) — both are opt-in via env vars. If neither env var is set, the endpoint accepts any POST with no authentication, allowing arbitrary webhook injection.

### H6 — `src/app/api/payments/webhook/route.ts` — `handlePaymentSuccess()` — attacker-controlled `schoolId`
When creating a new `feePayment` record, `schoolId` is taken from `notes.schoolId` (Razorpay order notes, attacker-controlled) with a fallback to the student record. An attacker who crafts a Razorpay order with a forged `schoolId` in notes could create payment records attributed to a different school.

---

## MEDIUM

---

### M1 — `src/lib/actions/hostelActions.ts` — `getHostelFees()`
Calls `requireSchoolAccess()` but does not check the return value for null/undefined before using `schoolId`. Minor: `requireSchoolAccess` likely throws on failure, but the pattern is inconsistent with other functions in the codebase.

### M2 — `src/lib/actions/lmsActions.ts` — `submitQuizAttempt()`
No Zod validation on `data.answers` array. Answers are stored directly without schema enforcement — malformed or oversized payloads are accepted.

### M3 — `src/lib/actions/libraryActions.ts` — `returnBook()`
`dailyFineRate` is accepted from the caller with no validation or cap. A caller could pass an arbitrarily large fine rate, resulting in inflated fine amounts stored in the database.

### M4 — `src/lib/actions/timetableActions.ts` — sequential conflict checks
`checkSlotConflict`, `checkTeacherAvailability`, `checkRoomAvailability` are called sequentially inside `createTimetableSlot` and `updateTimetableSlot`. These are independent queries and should be `Promise.all`'d — current pattern adds ~2× unnecessary latency per slot operation.

### M5 — `src/lib/actions/eventActions.ts` — `getEventParticipants()` N+1
Fetches all participants then issues a second `db.user.findMany` — two queries where a single join/include would suffice.

### M6 — `src/lib/actions/notificationActions.ts` — `getNotifications()`
`db.notification.findMany` has no `schoolId` filter in the `where` clause (only type/role filters). Returns notifications across all schools to any user with `COMMUNICATION_READ` permission.

### M7 — `src/lib/actions/alumniActions.ts` — `generateAlumniReport()`
`alumniService.generateReportData()` called without `schoolId`. Report data likely crosses school boundaries.

### M8 — `src/app/api/calendar/events/route.ts` — `GET`
`getEventsForUser(user.id, options)` called without explicitly passing `schoolId`. Correctness depends entirely on the visibility service's internal scoping — no explicit guard at the route level.

### M9 — `src/app/api/payments/create/route.ts` — `verifyParentChildRelationship()`
Checks `parentId` + `studentId` but does **not** verify the relationship belongs to the current school. A parent from School A with a valid `parentId` could reference a student from School B if they know the student's ID.

### M10 — `src/lib/services/report-card-data-aggregation.ts` — `fetchStudentInformation()` / `fetchStudentParentInfo()`
Both fetch by `studentId` only — no `schoolId` filter. These are internal service functions called from authenticated actions, but if invoked directly (e.g., from a new route) they expose cross-school student and parent data.

---

## LOW

---

### L1 — `src/lib/actions/lmsActions.ts` — `getCourses()`
No `take` limit on `findMany`. Could return unbounded results for large schools with many courses.

### L2 — `src/lib/actions/libraryActions.ts` — `getRecentLibraryActivity()`
Two sequential `findMany` calls (`recentIssues`, `recentReturns`) that are independent and could be `Promise.all`'d.

---

## CLEAN FILES

The following files were read and found to have no security issues:

| File | Notes |
|---|---|
| `src/lib/actions/timetableTopicActions.ts` | Uses `withSchoolAuthAction` throughout; all queries scoped by `schoolId` |
| `src/lib/actions/vehicleActions.ts` | `requireSchoolAccess()` + `schoolId` on all queries; permission checks on mutations |
| `src/lib/actions/routeActions.ts` | `requireSchoolAccess()` + `schoolId` on all queries; ownership verified before mutations |
| `src/lib/actions/transportAttendanceActions.ts` | `requireSchoolAccess()` + school verified via route relation on all queries |
| `src/app/api/parent/children/route.ts` | Uses `withSchoolAuth` wrapper |
| `src/app/api/parent/homework/route.ts` | Uses `withSchoolAuth` wrapper |
| `src/app/api/parent/timetable/route.ts` | Uses `withSchoolAuth` wrapper |
| `src/app/api/teacher/achievements/route.ts` | Uses `auth()` + `getRequiredSchoolId()`; schoolId applied to achievement queries |
| `src/app/api/teacher/events/route.ts` | Uses `auth()` + `getRequiredSchoolId()`; scoped by `schoolId` |
| `src/app/api/notifications/route.ts` | Uses `auth()`; all queries scoped to `userId` |
| `src/app/api/search/route.ts` | Uses `withSchoolAuth`; all queries scoped by `context.schoolId` |
| `src/app/api/classes/route.ts` | Uses `withSchoolAuth`; scoped by `context.schoolId` |
| `src/app/api/payments/create/route.ts` | `currentUser()`, CSRF token, rate limiting, parent-child check, schoolId on DB queries (see M9) |
| `src/app/api/payments/verify/route.ts` | Auth + schoolId scoping correct |
| `src/app/api/payments/webhook/route.ts` | HMAC-SHA256 signature verification via utility (see H6 for data issue) |
| `src/app/api/webhooks/stripe/route.ts` | HMAC-SHA256 + `timingSafeEqual` + 5-minute replay protection |
| `src/app/api/webhooks/whatsapp/route.ts` | HMAC-SHA256 + `timingSafeEqual` + raw body used for verification |
| `src/app/api/calendar/events/route.ts` | Uses `withSchoolAuth` (see M8 for scoping concern) |
| `src/lib/services/notification-service.ts` | All queries scoped by `userId`; `createNotification` requires explicit `schoolId` |
| `src/lib/services/email-service.ts` | Pure delivery service — no DB queries, no auth concerns |
| `src/app/admin/layout.tsx` | Checks `auth()`, redirects on missing session, enforces ADMIN role |
| `src/app/teacher/layout.tsx` | Checks `auth()`, redirects on missing session, enforces TEACHER role |
| `src/app/student/layout.tsx` | Checks `auth()`, redirects on missing session, enforces STUDENT role |
| `src/app/parent/layout.tsx` | Checks `auth()`, redirects on missing session, enforces PARENT role |
| `src/app/admin/users/students/page.tsx` | Uses `getRequiredSchoolId()`; all queries scoped by `schoolId` |
| `src/app/admin/users/teachers/page.tsx` | Uses `getRequiredSchoolId()`; all queries scoped by `schoolId` |
| `src/app/parent/fees/page.tsx` | Auth delegated to called actions; no direct DB queries |
| `src/app/student/fees/page.tsx` | Auth delegated to called actions; no direct DB queries |

---

## WEBHOOK SECURITY SUMMARY

| Webhook | Signature | Raw Body | timingSafeEqual | Verdict |
|---|---|---|---|---|
| Razorpay (`/api/payments/webhook`) | ✅ HMAC-SHA256 | ✅ | ✅ (in utility) | PASS — see H6 for data issue |
| Stripe (`/api/webhooks/stripe`) | ✅ HMAC-SHA256 | ✅ | ✅ | PASS |
| WhatsApp (`/api/webhooks/whatsapp`) | ✅ HMAC-SHA256 | ✅ | ✅ | PASS |
| MSG91 (`/api/webhooks/msg91`) | ⚠️ Optional token only | N/A | N/A | WEAK — see H5 |

---

## STATISTICS

| Severity | Count |
|---|---|
| CRITICAL | 29 |
| HIGH | 6 |
| MEDIUM | 10 |
| LOW | 2 |
| **Total** | **47** |

**Most affected files:**
- `src/lib/actions/hostelActions.ts` — 8 critical findings (C1–C8)
- `src/lib/actions/alumniActions.ts` — 5 critical findings (C19–C23)
- `src/app/api/student/` routes — 5 critical findings (C24–C28)
- `src/lib/actions/notificationActions.ts` — 2 critical + 1 high + 1 medium

**Root cause pattern (same as Pass 1):**  
Server action functions exported as `"use server"` with no `auth()` call and no `schoolId` filter — making them callable from any client with no authentication and returning data across all schools.

---

## FILES READ IN THIS PASS (43 total)

### Batch 1 — Action files
1. `src/lib/actions/hostelActions.ts`
2. `src/lib/actions/lmsActions.ts`
3. `src/lib/actions/libraryActions.ts`
4. `src/lib/actions/timetableActions.ts`
5. `src/lib/actions/eventActions.ts`
6. `src/lib/actions/notificationActions.ts`
7. `src/lib/actions/alumniActions.ts`
8. `src/lib/actions/transportAttendanceActions.ts`
9. `src/lib/actions/vehicleActions.ts`
10. `src/lib/actions/routeActions.ts`
11. `src/lib/actions/timetableTopicActions.ts`

### Batch 2 — API routes
12. `src/app/api/parent/children/route.ts`
13. `src/app/api/parent/homework/route.ts`
14. `src/app/api/parent/timetable/route.ts`
15. `src/app/api/student/achievements/route.ts`
16. `src/app/api/student/notes/route.ts`
17. `src/app/api/student/lessons/route.ts`
18. `src/app/api/student/flashcards/route.ts`
19. `src/app/api/student/mindmaps/route.ts`
20. `src/app/api/teacher/achievements/route.ts`
21. `src/app/api/teacher/events/route.ts`
22. `src/app/api/notifications/route.ts`
23. `src/app/api/search/route.ts`
24. `src/app/api/classes/route.ts`
25. `src/app/api/payments/create/route.ts`
26. `src/app/api/payments/verify/route.ts`
27. `src/app/api/payments/webhook/route.ts`
28. `src/app/api/webhooks/msg91/route.ts`
29. `src/app/api/webhooks/whatsapp/route.ts`
30. `src/app/api/webhooks/stripe/route.ts`
31. `src/app/api/calendar/events/route.ts`
32. `src/app/api/calendar/categories/route.ts`

### Batch 3 — Services
33. `src/lib/services/notification-service.ts`
34. `src/lib/services/email-service.ts`
35. `src/lib/services/report-card-data-aggregation.ts`

### Batch 4 — Layouts and pages
36. `src/app/admin/layout.tsx`
37. `src/app/teacher/layout.tsx`
38. `src/app/student/layout.tsx`
39. `src/app/parent/layout.tsx`
40. `src/app/admin/users/students/page.tsx`
41. `src/app/admin/users/teachers/page.tsx`
42. `src/app/parent/fees/page.tsx`
43. `src/app/student/fees/page.tsx`

---

## FILES NOT READ IN THIS PASS

The following files from the original request were not found or not accessible:

- `src/lib/actions/calendarActions.ts` — not found (may not exist)
- `src/lib/actions/documentActions.ts` — not found (may not exist)
- `src/lib/actions/certificateActions.ts` — not found (may not exist)
- `src/lib/actions/idCardActions.ts` — not found (may not exist)
- `src/lib/services/whatsapp-service.ts` / `sms-service.ts` — not read in this pass

These should be included in a Pass 3 if they exist.
