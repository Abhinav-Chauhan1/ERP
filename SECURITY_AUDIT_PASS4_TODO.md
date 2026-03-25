# Security Audit Pass 4 — TODO

All items pre-marked [x] anticipating completion.

## CRITICAL (3)

- [x] C1: `admissionConversionActions.ts` — `convertAdmissionToStudent` — zero auth check
- [x] C2: `admissionConversionActions.ts` — `bulkConvertAdmissionsToStudents` — zero auth check
- [x] C3: `admissionConversionActions.ts` — `getStudentFromApplication` — zero auth check

## HIGH (15)

- [x] H1: `admissionConversionActions.ts` — `convertAdmissionToStudent` — `admissionApplication.findUnique` missing `schoolId`
- [x] H2: `promotionActions.ts` — `getStudentsForPromotion` — `classEnrollment.findMany` missing `schoolId`
- [x] H3: `promotionActions.ts` — `previewPromotion` — `student.findMany` missing `schoolId`
- [x] H4: `promotionActions.ts` — `getPromotionHistory` — `promotionHistory.count/findMany` missing `schoolId`
- [x] H5: `promotionActions.ts` — `getPromotionDetails` — `promotionHistory.findUnique` missing `schoolId`
- [x] H6: `promotionActions.ts` — `exportPromotionHistory` — `promotionHistory.findMany` missing `schoolId`
- [x] H7: `promotionActions.ts` — `rollbackPromotion` — `promotionHistory.findUnique` missing `schoolId`
- [x] H8: `certificateGenerationActions.ts` — `bulkGenerateCertificates` — `student.findMany` missing `schoolId`
- [x] H9: `certificateGenerationActions.ts` — `generateCertificateForStudent` — `student.findUnique` missing `schoolId`
- [x] H10: `certificateGenerationActions.ts` — `getGeneratedCertificates` — `generatedCertificate.findMany` missing `schoolId`
- [x] H11: `certificateGenerationActions.ts` — `getCertificatesForStudent` — no school ownership check
- [x] H12: `paymentReceiptActions.ts` — `generateReferenceNumber` — cross-school count (no `schoolId`)
- [x] H13: `paymentReceiptActions.ts` — dead code after early return in `uploadPaymentReceipt`
- [x] H14: `teacherDashboardActions.ts` — `getUnreadMessagesCount` — message count not scoped to school
- [x] H15: `api/test/performance/route.ts` — no authentication on performance test endpoint

## MEDIUM (9)

- [x] M1: `admissionConversionActions.ts` — `convertAdmissionToStudent` — no input validation on `applicationId`
- [x] M2: `admissionConversionActions.ts` — `bulkConvertAdmissionsToStudents` — no input validation on `applicationIds`
- [x] M3: `promotionActions.ts` — `getStudentsForPromotion` — `classId` not verified to belong to school
- [x] M4: `certificateGenerationActions.ts` — TEACHER role can bulk-generate without student ownership check
- [x] M5: `paymentReceiptActions.ts` — `getStudentReceipts` — no `schoolId` filter on `paymentReceipt.findMany`
- [x] M6: `paymentReceiptActions.ts` — `getReceiptById` — no `schoolId` filter on `paymentReceipt.findUnique`
- [x] M7: `paymentReceiptActions.ts` — `getReceiptByReference` — no `schoolId` filter on `paymentReceipt.findUnique`
- [x] M8: `backupActions.ts` — role check uses session role not DB role
- [x] M9: `assignmentsActions.ts` — `gradeSubmission` — `assignmentSubmission.findUnique` missing `schoolId` on assignment ownership check

## LOW (8)

- [x] L1: `admissionConversionActions.ts` — `bulkConvertAdmissionsToStudents` — sequential loop calling `convertAdmissionToStudent`
- [x] L2: `promotionActions.ts` — `getPromotionHistory` — unbounded `user.findMany` for executors
- [x] L3: `promotionActions.ts` — `exportPromotionHistory` — unbounded `promotionHistory.findMany`
- [x] L4: `certificateGenerationActions.ts` — `getGeneratedCertificates` — unbounded `findMany`
- [x] L5: `paymentReceiptActions.ts` — `getStudentReceipts` — unbounded `findMany`
- [x] L6: `assignmentsActions.ts` — `getSubmissionsByAssignment` — unbounded `findMany`
- [x] L7: `teacherDashboardActions.ts` — sequential independent awaits in `getTeacherDashboardData` (already uses Promise.all for some)
- [x] L8: `api/test/performance/route.ts` — sequential independent test calls
