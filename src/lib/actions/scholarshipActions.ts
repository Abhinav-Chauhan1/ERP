"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

// Get all scholarships
export async function getScholarships(filters?: {
  limit?: number;
}) {
  try {
    const where: any = {};

    const scholarships = await db.scholarship.findMany({
      where,
      include: {
        recipients: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                enrollments: {
                  where: {
                    status: "ACTIVE",
                  },
                  include: {
                    class: true,
                    section: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: filters?.limit,
    });

    return { success: true, data: scholarships };
  } catch (error) {
    console.error("Error fetching scholarships:", error);
    return { success: false, error: "Failed to fetch scholarships" };
  }
}

// Get single scholarship by ID
export async function getScholarshipById(id: string) {
  try {
    const scholarship = await db.scholarship.findUnique({
      where: { id },
      include: {
        recipients: {
          include: {
            student: {
              include: {
                user: true,
                enrollments: {
                  where: {
                    status: "ACTIVE",
                  },
                  include: {
                    class: true,
                    section: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!scholarship) {
      return { success: false, error: "Scholarship not found" };
    }

    return { success: true, data: scholarship };
  } catch (error) {
    console.error("Error fetching scholarship:", error);
    return { success: false, error: "Failed to fetch scholarship" };
  }
}

// Create new scholarship
export async function createScholarship(data: any) {
  try {
    const scholarship = await db.scholarship.create({
      data: {
        name: data.name,
        description: data.description || null,
        amount: parseFloat(data.amount),
        percentage: data.percentage ? parseFloat(data.percentage) : null,
        criteria: data.criteria || data.eligibilityCriteria || null,
        duration: data.duration || null,
        fundedBy: data.fundedBy || null,
      },
    });

    revalidatePath("/admin/finance/scholarships");
    return { success: true, data: scholarship };
  } catch (error) {
    console.error("Error creating scholarship:", error);
    return { success: false, error: "Failed to create scholarship" };
  }
}

// Update scholarship
export async function updateScholarship(id: string, data: any) {
  try {
    const scholarship = await db.scholarship.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        percentage: data.percentage ? parseFloat(data.percentage) : null,
        criteria: data.criteria || data.eligibilityCriteria || null,
        duration: data.duration || null,
        fundedBy: data.fundedBy || null,
      },
    });

    revalidatePath("/admin/finance/scholarships");
    return { success: true, data: scholarship };
  } catch (error) {
    console.error("Error updating scholarship:", error);
    return { success: false, error: "Failed to update scholarship" };
  }
}

// Delete scholarship
export async function deleteScholarship(id: string) {
  try {
    // Check if scholarship has recipients
    const scholarship = await db.scholarship.findUnique({
      where: { id },
      include: {
        recipients: true,
      },
    });

    if (scholarship && scholarship.recipients.length > 0) {
      return { 
        success: false, 
        error: "Cannot delete scholarship with active recipients. Remove recipients first." 
      };
    }

    await db.scholarship.delete({
      where: { id },
    });

    revalidatePath("/admin/finance/scholarships");
    return { success: true };
  } catch (error) {
    console.error("Error deleting scholarship:", error);
    return { success: false, error: "Failed to delete scholarship" };
  }
}

// Get scholarship recipients
export async function getScholarshipRecipients(scholarshipId: string) {
  try {
    const recipients = await db.scholarshipRecipient.findMany({
      where: { scholarshipId },
      include: {
        student: {
          include: {
            user: true,
            enrollments: {
              where: {
                status: "ACTIVE",
              },
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
        scholarship: true,
      },
      orderBy: {
        awardDate: "desc",
      },
    });

    return { success: true, data: recipients };
  } catch (error) {
    console.error("Error fetching recipients:", error);
    return { success: false, error: "Failed to fetch recipients" };
  }
}

// Award scholarship to student
export async function awardScholarship(data: any) {
  try {
    // Check if student already has this scholarship
    const existing = await db.scholarshipRecipient.findFirst({
      where: {
        scholarshipId: data.scholarshipId,
        studentId: data.studentId,
        status: "Active",
      },
    });

    if (existing) {
      return { success: false, error: "Student already has this scholarship" };
    }

    // Get scholarship details
    const scholarship = await db.scholarship.findUnique({
      where: { id: data.scholarshipId },
    });

    const recipient = await db.scholarshipRecipient.create({
      data: {
        scholarshipId: data.scholarshipId,
        studentId: data.studentId,
        awardDate: new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        amount: data.amount ? parseFloat(data.amount) : scholarship!.amount,
        status: data.status || "Active",
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        scholarship: true,
      },
    });

    revalidatePath("/admin/finance/scholarships");
    return { success: true, data: recipient };
  } catch (error) {
    console.error("Error awarding scholarship:", error);
    return { success: false, error: "Failed to award scholarship" };
  }
}

// Remove scholarship recipient
export async function removeRecipient(id: string) {
  try {
    await db.scholarshipRecipient.update({
      where: { id },
      data: {
        status: "Expired",
      },
    });

    revalidatePath("/admin/finance/scholarships");
    return { success: true };
  } catch (error) {
    console.error("Error removing recipient:", error);
    return { success: false, error: "Failed to remove recipient" };
  }
}

// Get students for scholarship award
export async function getStudentsForScholarship() {
  try {
    const students = await db.student.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        enrollments: {
          where: {
            status: "ACTIVE",
          },
          include: {
            class: true,
            section: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    return { success: true, data: students };
  } catch (error) {
    console.error("Error fetching students:", error);
    return { success: false, error: "Failed to fetch students" };
  }
}

// Get scholarship statistics
export async function getScholarshipStats() {
  try {
    const [
      totalScholarships,
      totalRecipients,
      activeRecipients,
      totalAmountAwarded,
    ] = await Promise.all([
      db.scholarship.count(),
      db.scholarshipRecipient.count(),
      db.scholarshipRecipient.count({
        where: { status: "Active" },
      }),
      db.scholarshipRecipient.findMany({
        where: { status: "Active" },
      }).then((recipients) => {
        return recipients.reduce((sum, recipient) => {
          return sum + (recipient.amount || 0);
        }, 0);
      }),
    ]);

    return {
      success: true,
      data: {
        totalScholarships,
        activeScholarships: totalScholarships, // All scholarships are considered active
        totalRecipients,
        activeRecipients,
        totalAmountAwarded,
      },
    };
  } catch (error) {
    console.error("Error fetching scholarship stats:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}
