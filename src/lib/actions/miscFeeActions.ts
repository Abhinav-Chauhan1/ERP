"use server";

import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { PermissionAction, MiscFeeCategory, PaymentMethod, DiscountType, PaymentStatus } from "@prisma/client";
import { hasPermission } from "@/lib/utils/permissions";
import { formatFullName } from "@/lib/utils";
import { calculateDiscountAmount, calculateNetPayable, getFeeAmountsForClass } from "@/lib/utils/payment-helpers";
import { syncFeeInvoiceSummary } from "@/lib/services/fee-invoice-service";

// Helper to check permission and throw if denied — mirrors feeDiscountActions.ts
async function checkPermission(resource: string, action: PermissionAction, errorMessage?: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized: You must be logged in");
  }

  const allowed = await hasPermission(userId, resource, action);
  if (!allowed) {
    throw new Error(errorMessage || `Permission denied: Cannot ${action} ${resource}`);
  }

  return userId;
}

function computeMiscFeeStatus(netAmount: number, paidAmount: number): PaymentStatus {
  if (netAmount > 0 && paidAmount >= netAmount) return "COMPLETED";
  if (paidAmount > 0) return "PARTIAL";
  return "PENDING";
}

interface DiscountFields {
  discountType?: DiscountType | null;
  discountValue?: number | null;
}

function computeMiscFeeAmounts(amount: number, discount: DiscountFields, paidAmount: number) {
  const grossAmount = Math.max(amount, 0);
  const discountInput =
    discount.discountType && discount.discountValue
      ? { discountType: discount.discountType, value: discount.discountValue }
      : null;
  const discountAmount = calculateDiscountAmount(grossAmount, discountInput);
  const netAmount = calculateNetPayable(grossAmount, discountInput);
  const balance = Math.max(netAmount - paidAmount, 0);
  const status = computeMiscFeeStatus(netAmount, paidAmount);
  return { amount: grossAmount, discountAmount, netAmount, balance, status };
}

// Resolves the academic year of a student's current active enrollment — mirrors
// the lookup in feeDiscountActions.ts's getStudentFeeDiscountSummary, used so the
// single-student Books/Transport fee cards don't need an academicYearId prop.
export const getCurrentStudentAcademicYear = withSchoolAuthAction(
  async (schoolId: string, userId: string, userRole: string, studentId: string) => {
    try {
      await checkPermission("FEE_DISCOUNT", "READ", "You do not have permission to view fees");

      const student = await db.student.findFirst({
        where: { id: studentId, schoolId },
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            orderBy: { enrollDate: "desc" },
            take: 1,
            include: { class: { include: { academicYear: true } } },
          },
        },
      });

      const academicYear = student?.enrollments[0]?.class?.academicYear ?? null;
      return { success: true, data: academicYear ? { id: academicYear.id, name: academicYear.name } : null };
    } catch (error) {
      console.error("Error fetching student's current academic year:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch academic year" };
    }
  }
);

// Get a student's Books/Transport fee row for one academic year (student detail cards)
export const getMiscFee = withSchoolAuthAction(
  async (
    schoolId: string,
    userId: string,
    userRole: string,
    studentId: string,
    academicYearId: string,
    category: MiscFeeCategory
  ) => {
    try {
      await checkPermission("FEE_DISCOUNT", "READ", "You do not have permission to view fees");

      const row = await db.miscFeePayment.findFirst({
        where: { studentId, academicYearId, category, schoolId },
      });
      return { success: true, data: row };
    } catch (error) {
      console.error("Error fetching misc fee:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch fee" };
    }
  }
);

export interface UpsertMiscFeeInput {
  studentId: string;
  academicYearId: string;
  category: MiscFeeCategory;
  amount: number;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  dueDate?: Date | null;
  remarks?: string | null;
}

// Create or update a student's Books/Transport fee (amount + discount) for a year
export const upsertMiscFee = withSchoolAuthAction(
  async (schoolId: string, userId: string, userRole: string, input: UpsertMiscFeeInput) => {
    try {
      await checkPermission("FEE_DISCOUNT", "UPDATE", "You do not have permission to manage fees");

      const student = await db.student.findFirst({ where: { id: input.studentId, schoolId } });
      if (!student) {
        return { success: false, error: "Student not found" };
      }

      const academicYear = await db.academicYear.findFirst({ where: { id: input.academicYearId, schoolId } });
      if (!academicYear) {
        return { success: false, error: "Academic year not found" };
      }

      const existing = await db.miscFeePayment.findUnique({
        where: {
          studentId_academicYearId_category: {
            studentId: input.studentId,
            academicYearId: input.academicYearId,
            category: input.category,
          },
        },
      });

      const computed = computeMiscFeeAmounts(input.amount, input, existing?.paidAmount ?? 0);
      const data = {
        amount: computed.amount,
        discountType: input.discountType ?? null,
        discountValue: input.discountValue ?? null,
        discountAmount: computed.discountAmount,
        netAmount: computed.netAmount,
        balance: computed.balance,
        status: computed.status,
        dueDate: input.dueDate ?? null,
        remarks: input.remarks ?? null,
      };

      const row = await db.miscFeePayment.upsert({
        where: {
          studentId_academicYearId_category: {
            studentId: input.studentId,
            academicYearId: input.academicYearId,
            category: input.category,
          },
        },
        create: {
          studentId: input.studentId,
          academicYearId: input.academicYearId,
          category: input.category,
          schoolId,
          ...data,
        },
        update: data,
      });

      revalidatePath(`/admin/users/students/${input.studentId}`);
      return { success: true, data: row };
    } catch (error) {
      console.error("Error saving misc fee:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to save fee" };
    }
  }
);

export interface RecordMiscFeePaymentInput {
  paidAmount: number;
  paymentDate?: Date;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  receiptNumber?: string;
}

// Record a payment against a Books/Transport fee (increments paidAmount)
export const recordMiscFeePayment = withSchoolAuthAction(
  async (schoolId: string, userId: string, userRole: string, id: string, input: RecordMiscFeePaymentInput) => {
    try {
      await checkPermission("FEE_DISCOUNT", "UPDATE", "You do not have permission to record fee payments");

      const existing = await db.miscFeePayment.findFirst({ where: { id, schoolId } });
      if (!existing) {
        return { success: false, error: "Fee record not found" };
      }

      const paidAmount = Math.max(existing.paidAmount + input.paidAmount, 0);
      const balance = Math.max(existing.netAmount - paidAmount, 0);
      const status = computeMiscFeeStatus(existing.netAmount, paidAmount);

      const row = await db.miscFeePayment.update({
        where: { id },
        data: {
          paidAmount,
          balance,
          status,
          paymentDate: input.paymentDate ?? new Date(),
          paymentMethod: input.paymentMethod ?? existing.paymentMethod ?? undefined,
          transactionId: input.transactionId ?? existing.transactionId ?? undefined,
          receiptNumber: input.receiptNumber ?? existing.receiptNumber ?? undefined,
        },
      });

      revalidatePath(`/admin/users/students/${existing.studentId}`);
      return { success: true, data: row };
    } catch (error) {
      console.error("Error recording misc fee payment:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to record payment" };
    }
  }
);

export interface BulkDiscountFeeRow {
  studentId: string;
  rollNumber: string | null;
  name: string;
  fatherName: string | null;
  sectionName: string | null;
  normalFee: {
    feeStructureId: string | null;
    feeStructureName: string | null;
    grossTotal: number;
    value: number | null;
  };
  booksFee: {
    amount: number;
    discountValue: number | null;
  };
}

// Roster for a whole class (every section), merged with each student's current
// Normal Fee discount and Books fee rows — feeds the bulk discount grid.
export const getStudentsForBulkDiscount = withSchoolAuthAction(
  async (schoolId: string, userId: string, userRole: string, academicYearId: string, classId: string) => {
    try {
      await checkPermission("FEE_DISCOUNT", "READ", "You do not have permission to view fee discounts");

      const [academicClass, enrollments] = await Promise.all([
        db.class.findFirst({ where: { id: classId, schoolId, academicYearId } }),
        db.classEnrollment.findMany({
          where: { schoolId, classId, status: "ACTIVE" },
          include: {
            student: { select: { fatherName: true, user: { select: { firstName: true, lastName: true } } } },
            section: { select: { name: true } },
          },
          orderBy: [{ section: { name: "asc" } }, { rollNumber: "asc" }],
        }),
      ]);

      if (!academicClass) {
        return { success: false, error: "Class not found for the selected academic year" };
      }

      if (enrollments.length === 0) {
        return { success: true, data: { feeStructure: null as { id: string; name: string } | null, rows: [] as BulkDiscountFeeRow[] } };
      }

      const studentIds = enrollments.map((e) => e.studentId);

      const feeStructure = await db.feeStructure.findFirst({
        where: {
          academicYearId,
          isActive: true,
          OR: [
            { classes: { some: { classId } } },
            { AND: [{ classes: { none: {} } }, { applicableClasses: { contains: academicClass.name } }] },
          ],
        },
        include: { items: { include: { feeType: true } } },
      });

      let grossTotal = 0;
      if (feeStructure) {
        const feeTypeIds = feeStructure.items.map((item) => item.feeTypeId);
        const amountMap = await getFeeAmountsForClass(feeTypeIds, classId, schoolId);
        for (const item of feeStructure.items) {
          grossTotal += amountMap.get(item.feeTypeId) ?? item.feeType.amount;
        }
      }

      const [discounts, miscFees] = await Promise.all([
        feeStructure
          ? db.feeDiscount.findMany({
              where: { studentId: { in: studentIds }, feeStructureId: feeStructure.id, isActive: true },
            })
          : Promise.resolve([]),
        db.miscFeePayment.findMany({ where: { studentId: { in: studentIds }, academicYearId, category: "BOOKS" } }),
      ]);

      const discountMap = new Map(discounts.map((d) => [d.studentId, d]));
      const miscMap = new Map<string, Partial<Record<MiscFeeCategory, (typeof miscFees)[number]>>>();
      for (const m of miscFees) {
        const forStudent = miscMap.get(m.studentId) ?? {};
        forStudent[m.category] = m;
        miscMap.set(m.studentId, forStudent);
      }

      const rows: BulkDiscountFeeRow[] = enrollments.map((e) => {
        const discount = discountMap.get(e.studentId);
        const misc = miscMap.get(e.studentId) ?? {};
        return {
          studentId: e.studentId,
          rollNumber: e.rollNumber,
          name: formatFullName(e.student.user.firstName, e.student.user.lastName),
          fatherName: e.student.fatherName,
          sectionName: e.section?.name ?? null,
          normalFee: {
            feeStructureId: feeStructure?.id ?? null,
            feeStructureName: feeStructure?.name ?? null,
            grossTotal,
            value: discount?.value ?? null,
          },
          booksFee: {
            amount: misc.BOOKS?.amount ?? 0,
            discountValue: misc.BOOKS?.discountValue ?? null,
          },
        };
      });

      return {
        success: true,
        data: {
          feeStructure: feeStructure ? { id: feeStructure.id, name: feeStructure.name } : null,
          rows,
        },
      };
    } catch (error) {
      console.error("Error fetching students for bulk discount:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch students" };
    }
  }
);

export interface BulkDiscountSaveRow {
  studentId: string;
  normalFee: { value: number | null };
  booksFee: { amount: number; discountValue: number | null };
}

// Rows are processed this many at a time — each row does several sequential DB
// round-trips (fee discount + misc fee upserts + invoice resync), so running the
// whole class strictly one-by-one made a 76-student save take over a minute.
// Kept at/below DATABASE_URL's connection_limit: each row holds a dedicated
// pooled connection for its db.$transaction(), so a higher value here starves
// the pool and rows fail with "Unable to start a transaction in the given time".
const SAVE_CONCURRENCY = 5;

async function processInBatches<T, R>(items: T[], batchSize: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...(await Promise.all(batch.map(worker))));
  }
  return results;
}

// Bulk-saves Normal Fee discounts + Books fees for every row in one go, applying
// a single discount type (flat/percentage) across the whole class rather than
// per student/fee-type. Each student's writes are isolated (own transaction +
// try/catch) so one bad row doesn't fail the rest of the class — mirrors
// bulkImportActions.ts's per-row-isolated, whole-batch-reported result shape.
export const bulkSaveClassDiscounts = withSchoolAuthAction(
  async (
    schoolId: string,
    userId: string,
    userRole: string,
    academicYearId: string,
    classId: string,
    discountType: DiscountType,
    rows: BulkDiscountSaveRow[]
  ) => {
    try {
      await checkPermission("FEE_DISCOUNT", "UPDATE", "You do not have permission to manage fee discounts");

      const academicClass = await db.class.findFirst({ where: { id: classId, schoolId, academicYearId } });
      if (!academicClass) {
        return { success: false, error: "Class not found for the selected academic year" };
      }

      const feeStructure = await db.feeStructure.findFirst({
        where: {
          academicYearId,
          isActive: true,
          OR: [
            { classes: { some: { classId } } },
            { AND: [{ classes: { none: {} } }, { applicableClasses: { contains: academicClass.name } }] },
          ],
        },
      });

      const grantingUser = await db.user.findUnique({ where: { id: userId } });
      const grantedByName = grantingUser ? formatFullName(grantingUser.firstName, grantingUser.lastName) : null;

      const validStudentIds = new Set(
        (
          await db.classEnrollment.findMany({
            where: { schoolId, classId, status: "ACTIVE", studentId: { in: rows.map((r) => r.studentId) } },
            select: { studentId: true },
          })
        ).map((e) => e.studentId)
      );

      const results = await processInBatches(rows, SAVE_CONCURRENCY, async (row) => {
        try {
          if (!validStudentIds.has(row.studentId)) {
            throw new Error("Student is not enrolled in the selected class");
          }

          await db.$transaction(async (tx) => {
            if (feeStructure) {
              if (row.normalFee.value) {
                await tx.feeDiscount.upsert({
                  where: {
                    studentId_feeStructureId: { studentId: row.studentId, feeStructureId: feeStructure.id },
                  },
                  create: {
                    studentId: row.studentId,
                    feeStructureId: feeStructure.id,
                    discountType,
                    value: row.normalFee.value,
                    isActive: true,
                    grantedBy: userId,
                    grantedByName,
                    schoolId,
                  },
                  update: {
                    discountType,
                    value: row.normalFee.value,
                    isActive: true,
                    grantedBy: userId,
                    grantedByName,
                  },
                });
              } else {
                await tx.feeDiscount.updateMany({
                  where: { studentId: row.studentId, feeStructureId: feeStructure.id },
                  data: { isActive: false },
                });
              }
            }

            const existing = await tx.miscFeePayment.findUnique({
              where: {
                studentId_academicYearId_category: { studentId: row.studentId, academicYearId, category: "BOOKS" },
              },
            });
            const computed = computeMiscFeeAmounts(
              row.booksFee.amount,
              { discountType, discountValue: row.booksFee.discountValue },
              existing?.paidAmount ?? 0
            );
            const data = {
              amount: computed.amount,
              discountType: row.booksFee.discountValue ? discountType : null,
              discountValue: row.booksFee.discountValue ?? null,
              discountAmount: computed.discountAmount,
              netAmount: computed.netAmount,
              balance: computed.balance,
              status: computed.status,
            };

            await tx.miscFeePayment.upsert({
              where: {
                studentId_academicYearId_category: { studentId: row.studentId, academicYearId, category: "BOOKS" },
              },
              create: { studentId: row.studentId, academicYearId, category: "BOOKS", schoolId, ...data },
              update: data,
            });
          });

          if (feeStructure) {
            await syncFeeInvoiceSummary(row.studentId);
          }

          revalidatePath(`/admin/users/students/${row.studentId}`);
          return { studentId: row.studentId, success: true };
        } catch (rowError) {
          return {
            studentId: row.studentId,
            success: false,
            error: rowError instanceof Error ? rowError.message : "Failed to save",
          };
        }
      });

      revalidatePath(`/admin/finance/discounts`);

      return {
        success: true,
        data: {
          summary: {
            total: results.length,
            succeeded: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
          },
          results,
        },
      };
    } catch (error) {
      console.error("Error bulk-saving class discounts:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to save discounts" };
    }
  }
);

export interface BookFeeClassAnalytics {
  classId: string;
  className: string;
  studentsWithBookFee: number;
  totalAmount: number;
  totalDiscount: number;
  totalNetAmount: number;
  totalPaid: number;
  totalBalance: number;
}

// Class-wise rollup of Books Fee (MiscFeePayment, category=BOOKS) for the fee
// analytics page — mirrors the Class -> enrollments -> studentIds pattern used
// in fee-structure-analytics-service.ts, but keyed per-class instead of merged
// into one set, and joins misc fees by (studentId, class's academicYearId) so
// an unfiltered "all years" query doesn't cross-match a student's fee row from
// a different academic year than the class being summed.
export const getBookFeeAnalyticsByClass = withSchoolAuthAction(
  async (schoolId: string, userId: string, userRole: string, academicYearId?: string) => {
    try {
      await checkPermission("FEE_DISCOUNT", "READ", "You do not have permission to view fees");

      const classes = await db.class.findMany({
        where: { schoolId, ...(academicYearId ? { academicYearId } : {}) },
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            select: { studentId: true },
          },
        },
        orderBy: { name: "asc" },
      });

      if (classes.length === 0) {
        return { success: true, data: [] as BookFeeClassAnalytics[] };
      }

      const allStudentIds = Array.from(
        new Set(classes.flatMap((cls) => cls.enrollments.map((e) => e.studentId)))
      );

      const miscFees = await db.miscFeePayment.findMany({
        where: {
          schoolId,
          category: "BOOKS",
          studentId: { in: allStudentIds },
          ...(academicYearId ? { academicYearId } : {}),
        },
      });

      const miscFeeMap = new Map<string, (typeof miscFees)[number]>();
      for (const m of miscFees) {
        miscFeeMap.set(`${m.studentId}::${m.academicYearId}`, m);
      }

      const result: BookFeeClassAnalytics[] = classes.map((cls) => {
        let studentsWithBookFee = 0;
        let totalAmount = 0;
        let totalDiscount = 0;
        let totalNetAmount = 0;
        let totalPaid = 0;
        let totalBalance = 0;

        for (const enrollment of cls.enrollments) {
          const misc = miscFeeMap.get(`${enrollment.studentId}::${cls.academicYearId}`);
          if (!misc) continue;
          studentsWithBookFee++;
          totalAmount += misc.amount;
          totalDiscount += misc.discountAmount;
          totalNetAmount += misc.netAmount;
          totalPaid += misc.paidAmount;
          totalBalance += misc.balance;
        }

        return {
          classId: cls.id,
          className: cls.name,
          studentsWithBookFee,
          totalAmount,
          totalDiscount,
          totalNetAmount,
          totalPaid,
          totalBalance,
        };
      });

      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching book fee analytics:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch book fee analytics" };
    }
  }
);

export interface NormalFeeClassAnalytics {
  classId: string;
  className: string;
  studentsWithNormalFee: number;
  totalAmount: number;
  totalDiscount: number;
  totalNetAmount: number;
  totalPaid: number;
  totalBalance: number;
}

// Class-wise rollup of Normal Fee (FeeStructure/FeeDiscount, via the
// already-synced FeeInvoiceSummary) for the fee analytics page — the
// counterpart to getBookFeeAnalyticsByClass above, but Normal Fee has no
// single table of its own: gross/discount/net/paid/balance all live on
// FeeInvoiceSummary, kept in sync by syncFeeInvoiceSummary. Resolves each
// class's applicable fee structure with the same class-relation-first,
// applicableClasses-fallback pattern used in getFeeOverview/
// getFeeStructuresForStudent, then batches a single FeeInvoiceSummary query
// across all resolved structures rather than querying per class.
export const getNormalFeeAnalyticsByClass = withSchoolAuthAction(
  async (schoolId: string, userId: string, userRole: string, academicYearId?: string) => {
    try {
      await checkPermission("FEE_DISCOUNT", "READ", "You do not have permission to view fees");

      const classes = await db.class.findMany({
        where: { schoolId, ...(academicYearId ? { academicYearId } : {}) },
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            select: { studentId: true },
          },
        },
        orderBy: { name: "asc" },
      });

      if (classes.length === 0) {
        return { success: true, data: [] as NormalFeeClassAnalytics[] };
      }

      const academicYearIds = Array.from(new Set(classes.map((cls) => cls.academicYearId)));
      const feeStructures = await db.feeStructure.findMany({
        where: {
          schoolId,
          academicYearId: { in: academicYearIds },
          isActive: true,
        },
        include: { classes: { select: { classId: true } } },
      });

      const classToStructureId = new Map<string, string>();
      for (const cls of classes) {
        const match = feeStructures.find(
          (fs) =>
            fs.academicYearId === cls.academicYearId &&
            (fs.classes.some((c) => c.classId === cls.id) ||
              (fs.classes.length === 0 && !!fs.applicableClasses?.includes(cls.name)))
        );
        if (match) classToStructureId.set(cls.id, match.id);
      }

      const allStudentIds = Array.from(
        new Set(classes.flatMap((cls) => cls.enrollments.map((e) => e.studentId)))
      );
      const relevantStructureIds = Array.from(new Set(classToStructureId.values()));

      const invoiceSummaries = relevantStructureIds.length
        ? await db.feeInvoiceSummary.findMany({
            where: {
              schoolId,
              feeStructureId: { in: relevantStructureIds },
              studentId: { in: allStudentIds },
            },
          })
        : [];

      const invoiceMap = new Map<string, (typeof invoiceSummaries)[number]>();
      for (const inv of invoiceSummaries) {
        invoiceMap.set(`${inv.studentId}::${inv.feeStructureId}`, inv);
      }

      const result: NormalFeeClassAnalytics[] = classes.map((cls) => {
        const structureId = classToStructureId.get(cls.id);
        let studentsWithNormalFee = 0;
        let totalAmount = 0;
        let totalDiscount = 0;
        let totalNetAmount = 0;
        let totalPaid = 0;
        let totalBalance = 0;

        if (structureId) {
          for (const enrollment of cls.enrollments) {
            const inv = invoiceMap.get(`${enrollment.studentId}::${structureId}`);
            if (!inv) continue;
            studentsWithNormalFee++;
            totalAmount += inv.grossTotal;
            totalDiscount += inv.discountAmount;
            totalNetAmount += inv.netTotal;
            totalPaid += inv.paidAmount;
            totalBalance += inv.balance;
          }
        }

        return {
          classId: cls.id,
          className: cls.name,
          studentsWithNormalFee,
          totalAmount,
          totalDiscount,
          totalNetAmount,
          totalPaid,
          totalBalance,
        };
      });

      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching normal fee analytics:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch normal fee analytics" };
    }
  }
);
