"use server";

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidatePath, unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/utils/cache";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import { getCurrentParent } from "./parent-actions";

// Schema for primary parent toggle
const primaryParentSchema = z.object({
  childId: z.string().min(1, { message: "Child ID is required" }),
  isPrimary: z.boolean()
});

/**
 * Get all children of a parent with basic details
 * Cached for 5 minutes (300 seconds)
 */
export async function getMyChildren() {
  const result = await getCurrentParent();

  if (!result) {
    redirect("/login");
  }

  const { parent, dbUser, schoolId } = result;

  // Cached function to fetch children data
  const getCachedChildrenData = unstable_cache(
    async (parentId: string) => {
      return db.studentParent.findMany({
        where: {
          parentId,
          schoolId
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                }
              },
              enrollments: {
                orderBy: { enrollDate: 'desc' },
                take: 1,
                include: {
                  class: true,
                  section: true
                }
              }
            }
          }
        },
        orderBy: { isPrimary: 'desc' }
      });
    },
    [`parent-children-${parent.id}`],
    {
      tags: [CACHE_TAGS.STUDENTS, CACHE_TAGS.PARENTS, `parent-${parent.id}`],
      revalidate: 300
    }
  );

  const parentChildren = await getCachedChildrenData(parent.id);

  // Batch all attendance and subject lookups — no N+1
  const studentIds = parentChildren.map(pc => pc.student.id);
  const classIds = parentChildren
    .map(pc => pc.student.enrollments[0]?.classId)
    .filter((id): id is string => !!id);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [allAttendance, allSubjectClasses] = await Promise.all([
    db.studentAttendance.findMany({
      where: {
        schoolId,
        studentId: { in: studentIds },
        date: { gte: thirtyDaysAgo }
      }
    }),
    db.subjectClass.findMany({
      where: {
        schoolId,
        classId: { in: classIds }
      },
      select: {
        classId: true,
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })
  ]);

  // Group attendance by studentId
  const attendanceByStudent = new Map<string, typeof allAttendance>();
  for (const record of allAttendance) {
    const list = attendanceByStudent.get(record.studentId) ?? [];
    list.push(record);
    attendanceByStudent.set(record.studentId, list);
  }

  // Group subjects by classId
  const subjectsByClass = new Map<string, typeof allSubjectClasses[number]['subject'][]>();
  for (const sc of allSubjectClasses) {
    const list = subjectsByClass.get(sc.classId) ?? [];
    list.push(sc.subject);
    subjectsByClass.set(sc.classId, list);
  }

  const enrichedChildren = parentChildren.map(pc => {
    const currentEnrollment = pc.student.enrollments[0];
    const subjects = currentEnrollment
      ? (subjectsByClass.get(currentEnrollment.classId) ?? [])
      : [];

    const attendanceRecords = attendanceByStudent.get(pc.student.id) ?? [];
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === "PRESENT").length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      ...pc.student,
      isPrimary: pc.isPrimary,
      subjects,
      attendance: {
        percentage: attendancePercentage,
        totalDays,
        presentDays
      }
    };
  });

  return {
    parent,
    user: dbUser,
    children: enrichedChildren
  };
}

/**
 * Get detailed information about a specific child
 */
export async function getChildDetails(childId: string) {
  const result = await getCurrentParent();

  if (!result) {
    redirect("/login");
  }

  const { parent, dbUser, schoolId } = result;

  // Check if this child belongs to the parent AND the school
  const parentChild = await db.studentParent.findFirst({
    where: {
      parentId: parent.id,
      studentId: childId,
      schoolId
    }
  });

  if (!parentChild) {
    redirect("/parent/children/overview");
  }

  const student = await db.student.findFirst({
    where: {
      id: childId,
      schoolId
    },
    include: {
      user: true,
      enrollments: {
        orderBy: { enrollDate: 'desc' },
        take: 1,
        include: {
          class: true,
          section: true
        }
      }
    }
  });

  if (!student) {
    redirect("/parent/children/overview");
  }

  const currentEnrollment = student.enrollments?.[0];

  interface Subject {
    id: string;
    name: string;
    code: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  interface ExamResult {
    id: string;
    studentId: string;
    examId: string;
    marks: number;
    totalMarks?: number | null;
    grade?: string | null;
    remarks?: string | null;
    createdAt: Date;
    updatedAt: Date;
    exam: {
      id: string;
      name?: string;
      subject: {
        id: string;
        name: string;
        code: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        departmentId?: string | null;
      };
      examType: {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
      };
    };
  }

  let subjects: Subject[] = [];
  let examResults: ExamResult[] = [];

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  if (currentEnrollment) {
    const [subjectClasses, fetchedExamResults] = await Promise.all([
      db.subjectClass.findMany({
        where: {
          classId: currentEnrollment.classId,
          schoolId
        },
        include: { subject: true }
      }),
      db.examResult.findMany({
        where: {
          studentId: student.id,
          schoolId
        },
        include: {
          exam: {
            include: {
              subject: true,
              examType: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    subjects = subjectClasses.map(sc => sc.subject);
    examResults = fetchedExamResults;
  }

  const [attendanceRecords, assignments, feePayments] = await Promise.all([
    db.studentAttendance.findMany({
      where: {
        studentId: student.id,
        schoolId,
        date: { gte: threeMonthsAgo }
      },
      orderBy: { date: 'desc' }
    }),

    db.assignment.findMany({
      where: {
        schoolId,
        classes: {
          some: { classId: currentEnrollment?.classId }
        },
        dueDate: { gte: new Date() }
      },
      include: {
        subject: true,
        submissions: {
          where: { studentId: student.id }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 5
    }),

    db.feePayment.findMany({
      where: {
        studentId: student.id,
        schoolId
      },
      orderBy: { paymentDate: 'desc' },
      take: 5
    })
  ]);

  const totalFees = feePayments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = feePayments.reduce((sum, p) => sum + p.paidAmount, 0);
  const pendingAmount = totalFees - paidAmount;

  const behaviorRecords: unknown[] = [];

  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(r => r.status === "PRESENT").length;
  const absentDays = attendanceRecords.filter(r => r.status === "ABSENT").length;
  const lateDays = attendanceRecords.filter(r => r.status === "LATE").length;
  const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  return {
    parent,
    user: dbUser,
    student,
    currentEnrollment,
    subjects,
    examResults,
    attendanceRecords,
    attendanceStats: {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      percentage: attendancePercentage
    },
    assignments,
    feeStats: {
      totalFees,
      paidAmount,
      pendingAmount,
      payments: feePayments
    },
    behaviorRecords,
    isPrimary: parentChild.isPrimary
  };
}

/**
 * Set a parent as the primary parent for a child
 */
export async function setPrimaryParent(formData: FormData) {
  const result = await getCurrentParent();

  if (!result) {
    return { success: false, message: "Authentication required" };
  }

  try {
    const childId = formData.get('childId') as string;
    const isPrimary = formData.get('isPrimary') === 'true';

    const validatedData = primaryParentSchema.parse({ childId, isPrimary });

    const { parent, schoolId } = result;

    const parentChild = await db.studentParent.findFirst({
      where: {
        parentId: parent.id,
        studentId: validatedData.childId,
        schoolId
      }
    });

    if (!parentChild) {
      return { success: false, message: "Child not found" };
    }

    if (isPrimary) {
      await db.studentParent.updateMany({
        where: {
          studentId: validatedData.childId,
          isPrimary: true
        },
        data: { isPrimary: false }
      });
    }

    await db.studentParent.update({
      where: { id: parentChild.id },
      data: { isPrimary: validatedData.isPrimary }
    });

    revalidatePath(`/parent/children/${validatedData.childId}`);
    revalidatePath('/parent/children/overview');

    return {
      success: true,
      message: isPrimary
        ? "You are now set as the primary parent"
        : "You are no longer the primary parent"
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Error setting primary parent:", error);
    return { success: false, message: "Failed to update primary parent status" };
  }
}
