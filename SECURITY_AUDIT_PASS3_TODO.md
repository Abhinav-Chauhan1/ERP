# Security Audit Pass 3 — Fix TODO

All 30 findings from `SECURITY_AUDIT_PASS3_REPORT.md`.

## HIGH (14)

- [x] H-P3-01 `usersAction.ts` `updateUserDetails` — add auth + schoolId ownership check
- [x] H-P3-02 `usersAction.ts` `updateAdministrator` — add auth + schoolId ownership check
- [x] H-P3-03 `usersAction.ts` `updateTeacher` — add auth + schoolId ownership check
- [x] H-P3-04 `usersAction.ts` `updateStudent` — add auth + schoolId ownership check
- [x] H-P3-05 `usersAction.ts` `updateParent` — add auth + schoolId ownership check
- [x] H-P3-06 `usersAction.ts` `getStudentById` — add auth + schoolId filter
- [x] H-P3-07 `usersAction.ts` `getTeacherById` — add auth + schoolId filter
- [x] H-P3-08 `usersAction.ts` `getAdministratorById` — add auth + schoolId filter
- [x] H-P3-09 `messageActions.ts` `forwardMessage` — add schoolId to original message lookup
- [x] H-P3-10 `messageActions.ts` `deleteMessage` / `markAsRead` — add schoolId to message lookups
- [x] H-P3-11 `messageActions.ts` `getMessageStats` — add schoolId to count queries
- [x] H-P3-12 `messageActions.ts` `getWeeklyCommunicationStats` — add schoolId to findMany
- [x] H-P3-13 `permissionActions.ts` `getUsersForPermissionManagement` — add schoolId filter
- [x] H-P3-14 `permissionActions.ts` `assignPermissionToUser` / `removePermissionFromUser` — verify target user belongs to school

## MEDIUM (10)

- [x] M-P3-01 `usersAction.ts` `syncClerkUser` — add auth check
- [x] M-P3-02 `usersAction.ts` `associateStudentWithParent` — verify student+parent belong to school
- [x] M-P3-03 `messageActions.ts` `getMessageById` — add schoolId to message lookup
- [x] M-P3-04 `feeStructureActions.ts` `deleteFeeType` — pass schoolId to service
- [x] M-P3-05 `feeStructureActions.ts` analytics actions — pass schoolId to analytics service
- [x] M-P3-06 `feeStructureActions.ts` bulk assign/remove — pass schoolId to service
- [x] M-P3-07 `dashboardActions.ts` — remove redundant inner `auth()` calls
- [x] M-P3-08 `attendanceActions.ts` `markBulkTeacherAttendance` — add permission check
- [x] M-P3-09 `feePaymentActions.ts` `getFeeStructuresForStudent` — add schoolId to feeStructure query
- [x] M-P3-10 `reportCardsActions.ts` CBSE actions — use session schoolId for school lookup

## LOW (6)

- [x] L-P3-01 `bulkMessagingActions.ts` `getBulkMessageHistory` — add schoolId filter
- [x] L-P3-02 `bulkMessagingActions.ts` `getBulkMessageProgress` — add schoolId filter
- [x] L-P3-03 `announcementActions.ts` `getAnnouncements` — add default take limit
- [x] L-P3-04 `attendanceActions.ts` `getStudentAttendanceReport` — add take limit
- [x] L-P3-05 `dashboardActions.ts` `getExamResultsData` — fix N+1 query
- [x] L-P3-06 `uploadRoute` — no action needed (folder structure is cosmetic, not a security gate)
