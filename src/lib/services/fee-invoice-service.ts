import { db } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";
import { runWithTenantContext, runWithSuperAdminContext } from "@/lib/tenant-context";
import {
  getActiveFeeDiscount,
  calculateDiscountAmount,
  calculateNetPayable,
  getFeeAmountsForClass,
  calculateAccruedFeeTotal,
} from "@/lib/utils/payment-helpers";

/**
 * Recomputes and upserts the FeeInvoiceSummary row for one student against their
 * current class's active fee structure. This mirrors getStudentFeeDetails'
 * calculation (student-fee-actions.ts) exactly, so the materialized summary never
 * drifts from what the student's own Fees tab shows.
 *
 * Call this after anything that changes what a student owes or has paid: a
 * payment is recorded/updated/deleted, a discount changes, a student enrolls
 * (admission, bulk import, promotion), or a fee structure/class amount changes.
 * The nightly cron (api/cron/recalculate-fee-invoices) also sweeps every active
 * student to catch pure time-based accrual (e.g. a new month of a monthly fee
 * becoming due) that no discrete event would otherwise trigger.
 *
 * Explicitly establishes tenant (RLS) context rather than relying on an ambient
 * request session, since this is called from places with no session at all —
 * payment webhooks, the nightly cron, and backfill scripts.
 */
export async function syncFeeInvoiceSummary(studentId: string): Promise<void> {
  // The student's schoolId isn't known yet, so this one lookup runs as a
  // scoped, id-keyed global read — safe because studentId is trusted internal
  // input, not user-supplied filtering.
  const student = await runWithSuperAdminContext(async () =>
    await db.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          orderBy: { enrollDate: "desc" },
          take: 1,
          include: { class: { include: { academicYear: true } } },
        },
      },
    })
  );

  if (!student) return;

  await runWithTenantContext({ schoolId: student.schoolId, isSuperAdmin: false }, async () => {
    const currentEnrollment = student.enrollments[0];
    const classId = currentEnrollment?.class?.id;
    const academicYearId = currentEnrollment?.class?.academicYear?.id;

    if (!classId || !academicYearId) return;

    const feeStructure = await db.feeStructure.findFirst({
      where: {
        academicYearId,
        isActive: true,
        OR: [
          { classes: { some: { classId } } },
          {
            AND: [
              { classes: { none: {} } },
              { applicableClasses: { contains: currentEnrollment.class.name } },
            ],
          },
        ],
      },
      include: { items: { include: { feeType: true } } },
    });

    if (!feeStructure) return;

    const feeTypeIds = feeStructure.items.map((item) => item.feeTypeId);
    const classAmountMap = await getFeeAmountsForClass(feeTypeIds, classId, student.schoolId);

    const grossTotal = feeStructure.items.reduce(
      (sum, item) => sum + (classAmountMap.get(item.feeTypeId) ?? item.feeType.amount),
      0
    );

    const discount = await getActiveFeeDiscount(student.id, feeStructure.id, student.schoolId);
    const discountAmount = calculateDiscountAmount(grossTotal, discount);
    const netTotal = calculateNetPayable(grossTotal, discount);

    const feePayments = await db.feePayment.findMany({
      where: { studentId: student.id, feeStructureId: feeStructure.id },
      select: { paidAmount: true },
    });
    const paidAmount = feePayments.reduce((sum, p) => sum + p.paidAmount, 0);
    const balance = Math.max(netTotal - paidAmount, 0);

    const effectiveStartDate = new Date(
      Math.max(feeStructure.validFrom.getTime(), currentEnrollment.enrollDate.getTime())
    );
    const now = new Date();
    const asOfDate = feeStructure.validTo && feeStructure.validTo < now ? feeStructure.validTo : now;

    const accrualItems = feeStructure.items.map((item) => ({
      annualizedAmount: classAmountMap.get(item.feeTypeId) ?? item.feeType.amount,
      frequency: item.feeType.frequency,
      dueDate: item.dueDate,
    }));
    const accruedGrossTotal = calculateAccruedFeeTotal(accrualItems, effectiveStartDate, asOfDate);
    const netRatio = grossTotal > 0 ? netTotal / grossTotal : 1;
    const accruedNetTotal = accruedGrossTotal * netRatio;
    const dueAmount = Math.max(accruedNetTotal - paidAmount, 0);

    const status: PaymentStatus =
      netTotal > 0 && paidAmount >= netTotal
        ? PaymentStatus.COMPLETED
        : paidAmount > 0
          ? PaymentStatus.PARTIAL
          : PaymentStatus.PENDING;

    await db.feeInvoiceSummary.upsert({
      where: { studentId_feeStructureId: { studentId: student.id, feeStructureId: feeStructure.id } },
      create: {
        studentId: student.id,
        feeStructureId: feeStructure.id,
        schoolId: student.schoolId,
        grossTotal,
        discountAmount,
        netTotal,
        paidAmount,
        balance,
        dueAmount,
        status,
      },
      update: {
        grossTotal,
        discountAmount,
        netTotal,
        paidAmount,
        balance,
        dueAmount,
        status,
      },
    });
  });
}

/**
 * Sweeps every actively-enrolled student in a school, resyncing their
 * FeeInvoiceSummary. Used for the initial backfill and the nightly cron.
 * Runs in small concurrent batches to avoid saturating the DB connection pool.
 */
export async function syncFeeInvoiceSummariesForSchool(
  schoolId: string,
  batchSize = 20
): Promise<{ studentsProcessed: number }> {
  const students = await runWithTenantContext({ schoolId, isSuperAdmin: false }, async () =>
    await db.student.findMany({
      where: { schoolId, enrollments: { some: { status: "ACTIVE" } } },
      select: { id: true },
    })
  );

  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    await Promise.all(batch.map((s) => syncFeeInvoiceSummary(s.id)));
  }

  return { studentsProcessed: students.length };
}
