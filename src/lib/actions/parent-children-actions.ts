"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { revalidatePath, unstable_cache, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/utils/cache";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// Schema for validating child detail requests
const childDetailSchema = z.object({
  childId: z.string().min(1, { message: "Child ID is required" })
});

// Schema for primary parent toggle
const primaryParentSchema = z.object({
  childId: z.string().min(1, { message: "Child ID is required" }),
  isPrimary: z.boolean()
});

/**
 * Get the current parent
 */
async function getCurrentParent() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  // Get user from database
  const dbUser = await db.user.findUnique({
    where: { id: clerkUser.id }
  });

  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    return null;
  }

  const { schoolId } = await requireSchoolAccess();
  if (!schoolId) return null;

  const parent = await db.parent.findFirst({
    where: {
      userId: dbUser.id,
      schoolId // Enforce tenant isolation
    }
  });

  if (!parent) {
    return null;
  }

  return { parent, dbUser };
}

/**
 * Get all children of a parent with basic details
 * Cached for 5 minutes (300 seconds) as per requirements 9.5
 */
export async function getMyChildren() {
  const result = await getCurrentParent();

  if (!result) {
    redirect("/login");
  }

  const { parent, dbUser } = result;

  // Cached function to fetch children data
  const getCachedChildrenData = unstable_cache(
    async (parentId: string) => {
      // Get all children of this parent
      const parentChildren = await db.studentParent.findMany({
        where: {
          parentId
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
                orderBy: {
                  enrollDate: 'desc'
                },
                take: 1,
                include: {
                  class: true,
                  section: true
                }
              }
            }
          }
        },
        orderBy: {
          isPrimary: 'desc'
        }
      });

      return parentChildren;
    },
    [`parent-children-${parent.id}`],
    {
      tags: [CACHE_TAGS.STUDENTS, CACHE_TAGS.PARENTS, `parent-${parent.id}`],
      revalidate: 300 // 5 minutes
    }
  );

  const parentChildren = await getCachedChildrenData(parent.id);

  // Get subjects for each child
  const enrichedChildren = await Promise.all(
    parentChildren.map(async (pc) => {
      const currentEnrollment = pc.student.enrollments[0];

      // Define interfaces for subjects
      interface Subject {
        id: string;
        name: string;
        code: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
      }

      let subjects: Subject[] = [];
      if (currentEnrollment) {
        // Get subjects for this class
        const subjectClasses = await db.subjectClass.findMany({
          where: {
            classId: currentEnrollment.classId
          },
          include: {
            subject: true
          }
        });

        subjects = subjectClasses.map(sc => sc.subject);
      }

      // Get attendance stats for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const attendanceRecords = await db.studentAttendance.findMany({
        where: {
          studentId: pc.student.id,
          date: {
            gte: thirtyDaysAgo
          }
        }
      });

      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(record => record.status === "PRESENT").length;
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
    })
  );

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

  const { parent, dbUser } = result;

  // Check if this child belongs to the parent
  const parentChild = await db.studentParent.findFirst({
    where: {
      parentId: parent.id,
      studentId: childId
    }
  });

  if (!parentChild) {
    redirect("/parent/children/overview");
  }

  // Get full student details
  const { schoolId } = await requireSchoolAccess();

  const student = await db.student.findFirst({
    where: {
      id: childId,
      ...(schoolId && { schoolId }) // Only add schoolId filter if it exists
    },
    include: {
      user: true,
      enrollments: {
        orderBy: {
          enrollDate: 'desc'
        },
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

  // Get the current enrollment details
  const currentEnrollment = student.enrollments?.[0];

  // Get subjects and performance
  interface Subject {
    id: string;
    name: string;
    code: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  let subjects: Subject[] = [];
  // Define interface for exam results
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

  let examResults: ExamResult[] = [];

  if (currentEnrollment) {
    // Get subjects for this class
    const subjectClasses = await db.subjectClass.findMany({
      where: {
        classId: currentEnrollment.classId
      },
      include: {
        subject: true
      }
    });

    subjects = subjectClasses.map(sc => sc.subject);

    // Get exam results
    examResults = await db.examResult.findMany({
      where: {
        studentId: student.id
      },
      include: {
        exam: {
          include: {
            subject: true,
            examType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
  }

  // Get attendance records for the past 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const attendanceRecords = await db.studentAttendance.findMany({
    where: {
      studentId: student.id,
      date: {
        gte: threeMonthsAgo
      }
    },
    orderBy: {
      date: 'desc'
    }
  });

  // Get upcoming assignments
  const assignments = await db.assignment.findMany({
    where: {
      classes: {
        some: {
          classId: currentEnrollment?.classId
        }
      },
      dueDate: {
        gte: new Date()
      }
    },
    include: {
      subject: true,
      submissions: {
        where: {
          studentId: student.id
        }
      }
    },
    orderBy: {
      dueDate: 'asc'
    },
    take: 5
  });

  // Get fee details
  const feePayments = await db.feePayment.findMany({
    where: {
      studentId: student.id
    },
    orderBy: {
      paymentDate: 'desc'
    },
    take: 5
  });

  // Calculate fee statistics
  const totalFees = feePayments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidAmount = feePayments.reduce((sum, payment) => sum + payment.paidAmount, 0);
  const pendingAmount = totalFees - paidAmount;

  // Get behavior records
  // TODO: Uncomment when behaviorRecord model is added to schema
  // const behaviorRecords = await db.behaviorRecord.findMany({
  //   where: {
  //     studentId: student.id
  //   },
  //   include: {
  //     teacher: {
  //       include: {
  //         user: {
  //           select: {
  //             firstName: true,
  //             lastName: true
  //           }
  //         }
  //       }
  //     }
  //   },
  //   orderBy: {
  //     date: 'desc'
  //   },
  //   take: 10
  // });
  const behaviorRecords: any[] = [];

  // Calculate attendance statistics
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(record => record.status === "PRESENT").length;
  const absentDays = attendanceRecords.filter(record => record.status === "ABSENT").length;
  const lateDays = attendanceRecords.filter(record => record.status === "LATE").length;
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

    // Validate the data
    const validatedData = primaryParentSchema.parse({
      childId,
      isPrimary
    });

    const { parent } = result;

    // Check if this child belongs to the parent
    const parentChild = await db.studentParent.findFirst({
      where: {
        parentId: parent.id,
        studentId: validatedData.childId
      }
    });

    if (!parentChild) {
      return { success: false, message: "Child not found" };
    }

    // If setting as primary, first remove primary status from any other parent
    if (isPrimary) {
      await db.studentParent.updateMany({
        where: {
          studentId: validatedData.childId,
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      });
    }

    // Update the parent-child relationship
    await db.studentParent.update({
      where: {
        id: parentChild.id
      },
      data: {
        isPrimary: validatedData.isPrimary
      }
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
      return {
        success: false,
        message: error.errors[0].message
      };
    }

    console.error("Error setting primary parent:", error);
    return { success: false, message: "Failed to update primary parent status" };
  }
}
