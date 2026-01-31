"use server";

import { db } from "@/lib/db";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { revalidatePath } from "next/cache";

export interface SchoolFilters {
  search?: string;
  status?: string;
  plan?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  userCountMin?: number;
  userCountMax?: number;
  hasActiveSubscription?: boolean;
  isOnboarded?: boolean;
}

export async function getSchoolsWithFilters(filters: SchoolFilters = {}) {
  await requireSuperAdminAccess();

  try {
    const where: any = {};

    // Search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { schoolCode: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    // Plan filter
    if (filters.plan && filters.plan !== "ALL") {
      where.plan = filters.plan;
    }

    // Date filters
    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {};
      if (filters.createdAfter) {
        where.createdAt.gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        where.createdAt.lte = filters.createdBefore;
      }
    }

    // Onboarding filter
    if (filters.isOnboarded !== undefined) {
      where.isOnboarded = filters.isOnboarded;
    }

    const schools = await db.school.findMany({
      where,
      include: {
        _count: {
          select: {
            administrators: true,
            teachers: true,
            students: true,
            subscriptions: true,
          },
        },
        subscriptions: {
          where: { isActive: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        administrators: {
          take: 3, // Get more administrators for better overview
          include: {
            user: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        // Add additional useful data to prevent future lazy loading
        permissions: true,
        securitySettings: true,
        dataManagementSettings: true,
        notificationSettings: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Apply user count filters (post-query filtering since it's calculated)
    let filteredSchools = schools;
    if (filters.userCountMin !== undefined || filters.userCountMax !== undefined) {
      filteredSchools = schools.filter((school) => {
        const totalUsers = school._count.administrators + school._count.teachers + school._count.students;
        if (filters.userCountMin !== undefined && totalUsers < filters.userCountMin) {
          return false;
        }
        if (filters.userCountMax !== undefined && totalUsers > filters.userCountMax) {
          return false;
        }
        return true;
      });
    }

    // Apply subscription filter
    if (filters.hasActiveSubscription !== undefined) {
      filteredSchools = filteredSchools.filter((school) => {
        const hasActiveSubscription = school.subscriptions.length > 0;
        return hasActiveSubscription === filters.hasActiveSubscription;
      });
    }

    return {
      success: true,
      data: filteredSchools.map((school) => ({
        id: school.id,
        name: school.name,
        schoolCode: school.schoolCode,
        email: school.email,
        status: school.status,
        plan: school.plan,
        isOnboarded: school.isOnboarded,
        createdAt: school.createdAt,
        updatedAt: school.updatedAt,
        userCounts: {
          administrators: school._count.administrators,
          teachers: school._count.teachers,
          students: school._count.students,
          total: school._count.administrators + school._count.teachers + school._count.students,
        },
        subscription: school.subscriptions[0] || null,
        primaryAdmin: school.administrators[0] ? {
          id: school.administrators[0].id,
          name: school.administrators[0].user.name,
          email: school.administrators[0].user.email,
        } : null,
      })),
    };
  } catch (error) {
    console.error("Error fetching schools:", error);
    return {
      success: false,
      error: "Failed to fetch schools",
    };
  }
}

export async function bulkUpdateSchoolStatus(schoolIds: string[], status: "ACTIVE" | "SUSPENDED") {
  await requireSuperAdminAccess();

  try {
    await db.school.updateMany({
      where: {
        id: {
          in: schoolIds,
        },
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Log the bulk action
    await db.auditLog.create({
      data: {
        userId: null, // Super admin actions don't require specific user ID for now
        action: "UPDATE",
        resource: "SCHOOL",
        resourceId: schoolIds.join(","),
        changes: {
          status,
          schoolCount: schoolIds.length,
        },
        checksum: "bulk-update-" + Date.now(),
      },
    });

    try {
      revalidatePath("/super-admin/schools");
    } catch (error) {
      // Ignore revalidation errors in test environment
      if (process.env.NODE_ENV !== 'test') {
        console.warn("Failed to revalidate path:", error);
      }
    }
    
    return {
      success: true,
      message: `Successfully updated ${schoolIds.length} schools to ${status}`,
    };
  } catch (error) {
    console.error("Error updating school status:", error);
    return {
      success: false,
      error: "Failed to update school status",
    };
  }
}

export async function bulkDeleteSchools(schoolIds: string[]) {
  await requireSuperAdminAccess();

  try {
    // First, get school names for logging
    const schools = await db.school.findMany({
      where: {
        id: {
          in: schoolIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Delete schools (this will cascade to related records)
    await db.school.deleteMany({
      where: {
        id: {
          in: schoolIds,
        },
      },
    });

    // Log the bulk action
    await db.auditLog.create({
      data: {
        userId: null, // Super admin actions don't require specific user ID for now
        action: "DELETE",
        resource: "SCHOOL",
        resourceId: schoolIds.join(","),
        changes: {
          schoolCount: schoolIds.length,
          schoolNames: schools.map(s => s.name),
        },
        checksum: "bulk-delete-" + Date.now(),
      },
    });

    try {
      revalidatePath("/super-admin/schools");
    } catch (error) {
      // Ignore revalidation errors in test environment
      if (process.env.NODE_ENV !== 'test') {
        console.warn("Failed to revalidate path:", error);
      }
    }
    
    return {
      success: true,
      message: `Successfully deleted ${schoolIds.length} schools`,
    };
  } catch (error) {
    console.error("Error deleting schools:", error);
    return {
      success: false,
      error: "Failed to delete schools",
    };
  }
}

export async function getSchoolDetails(schoolId: string) {
  await requireSuperAdminAccess();

  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      include: {
        administrators: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            createdAt: true,
          },
        },
        teachers: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            createdAt: true,
          },
          take: 10, // Limit for performance
        },
        students: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            createdAt: true,
          },
          take: 10, // Limit for performance
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            isActive: true,
            startDate: true,
            endDate: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            administrators: true,
            teachers: true,
            students: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!school) {
      return {
        success: false,
        error: "School not found",
      };
    }

    return {
      success: true,
      data: school,
    };
  } catch (error) {
    console.error("Error fetching school details:", error);
    return {
      success: false,
      error: "Failed to fetch school details",
    };
  }
}

export async function updateSchoolStatus(schoolId: string, status: "ACTIVE" | "SUSPENDED") {
  await requireSuperAdminAccess();

  try {
    const school = await db.school.update({
      where: { id: schoolId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: null, // Super admin actions don't require specific user ID for now
        action: "UPDATE",
        resource: "SCHOOL",
        resourceId: schoolId,
        changes: {
          oldStatus: school.status,
          newStatus: status,
        },
        checksum: "update-status-" + Date.now(),
      },
    });

    try {
      revalidatePath("/super-admin/schools");
    } catch (error) {
      // Ignore revalidation errors in test environment
      if (process.env.NODE_ENV !== 'test') {
        console.warn("Failed to revalidate path:", error);
      }
    }
    
    return {
      success: true,
      data: school,
    };
  } catch (error) {
    console.error("Error updating school status:", error);
    return {
      success: false,
      error: "Failed to update school status",
    };
  }
}

/**
 * Reset school onboarding state - sets isOnboarded to false and clears onboarding progress
 * Requirements: 9.4 - WHEN a super admin resets onboarding, THE System SHALL set isOnboarded flag to false and clear onboarding progress
 */
export async function resetSchoolOnboarding(schoolId: string) {
  await requireSuperAdminAccess();

  try {
    // Get current school state for logging
    const currentSchool = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        isOnboarded: true,
        onboardingStep: true,
        onboardingCompletedAt: true,
      },
    });

    if (!currentSchool) {
      return {
        success: false,
        error: "School not found",
      };
    }

    // Reset onboarding state
    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        isOnboarded: false,
        onboardingStep: 0,
        onboardingCompletedAt: null,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: null, // Super admin actions don't require specific user ID for now
        action: "UPDATE",
        resource: "SCHOOL",
        resourceId: schoolId,
        changes: {
          schoolName: currentSchool.name,
          previousState: {
            isOnboarded: currentSchool.isOnboarded,
            onboardingStep: currentSchool.onboardingStep,
            onboardingCompletedAt: currentSchool.onboardingCompletedAt,
          },
          newState: {
            isOnboarded: false,
            onboardingStep: 0,
            onboardingCompletedAt: null,
          },
        },
        checksum: "reset-onboarding-" + Date.now(),
      },
    });

    try {
      revalidatePath("/super-admin/schools");
    } catch (error) {
      // Ignore revalidation errors in test environment
      if (process.env.NODE_ENV !== 'test') {
        console.warn("Failed to revalidate path:", error);
      }
    }
    
    return {
      success: true,
      data: {
        school: updatedSchool,
        message: `Onboarding state reset for ${currentSchool.name}. School admin will be redirected to setup wizard on next login.`,
      },
    };
  } catch (error) {
    console.error("Error resetting school onboarding:", error);
    return {
      success: false,
      error: "Failed to reset school onboarding state",
    };
  }
}

/**
 * Launch setup wizard for a school - resets onboarding to allow re-setup
 * Requirements: 9.4 - Super admin controls for managing onboarding state
 */
export async function launchSetupWizard(schoolId: string) {
  await requireSuperAdminAccess();

  try {
    // Get current school state
    const currentSchool = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        isOnboarded: true,
        onboardingStep: true,
      },
    });

    if (!currentSchool) {
      return {
        success: false,
        error: "School not found",
      };
    }

    // Set onboarding to step 1 (start of wizard) but keep isOnboarded false
    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        isOnboarded: false,
        onboardingStep: 1, // Start at step 1 to begin wizard
        updatedAt: new Date(),
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: null, // Super admin actions don't require specific user ID for now
        action: "UPDATE",
        resource: "SCHOOL",
        resourceId: schoolId,
        changes: {
          schoolName: currentSchool.name,
          previousOnboardingStep: currentSchool.onboardingStep,
          newOnboardingStep: 1,
          action: "setup_wizard_launched",
        },
        checksum: "launch-wizard-" + Date.now(),
      },
    });

    try {
      revalidatePath("/super-admin/schools");
    } catch (error) {
      // Ignore revalidation errors in test environment
      if (process.env.NODE_ENV !== 'test') {
        console.warn("Failed to revalidate path:", error);
      }
    }
    
    return {
      success: true,
      data: {
        school: updatedSchool,
        message: `Setup wizard launched for ${currentSchool.name}. School admin will be guided through setup on next login.`,
      },
    };
  } catch (error) {
    console.error("Error launching setup wizard:", error);
    return {
      success: false,
      error: "Failed to launch setup wizard",
    };
  }
}

/**
 * Get onboarding status for multiple schools
 * Requirements: 9.4 - Super admin controls for managing onboarding state
 */
export async function getSchoolsOnboardingStatus(schoolIds: string[]) {
  await requireSuperAdminAccess();

  try {
    const schools = await db.school.findMany({
      where: {
        id: {
          in: schoolIds,
        },
      },
      select: {
        id: true,
        name: true,
        isOnboarded: true,
        onboardingStep: true,
        onboardingCompletedAt: true,
      },
    });

    return {
      success: true,
      data: schools.map(school => ({
        id: school.id,
        name: school.name,
        isOnboarded: school.isOnboarded,
        onboardingStep: school.onboardingStep,
        onboardingCompletedAt: school.onboardingCompletedAt,
        requiresSetup: !school.isOnboarded,
      })),
    };
  } catch (error) {
    console.error("Error fetching schools onboarding status:", error);
    return {
      success: false,
      error: "Failed to fetch onboarding status",
    };
  }
}

/**
 * Bulk reset onboarding for multiple schools
 * Requirements: 9.4 - Super admin controls for managing onboarding state
 */
export async function bulkResetOnboarding(schoolIds: string[]) {
  await requireSuperAdminAccess();

  try {
    // Get current schools state for logging
    const currentSchools = await db.school.findMany({
      where: {
        id: {
          in: schoolIds,
        },
      },
      select: {
        id: true,
        name: true,
        isOnboarded: true,
        onboardingStep: true,
      },
    });

    // Reset onboarding for all schools
    await db.school.updateMany({
      where: {
        id: {
          in: schoolIds,
        },
      },
      data: {
        isOnboarded: false,
        onboardingStep: 0,
        onboardingCompletedAt: null,
        updatedAt: new Date(),
      },
    });

    // Log the bulk action
    await db.auditLog.create({
      data: {
        userId: null, // Super admin actions don't require specific user ID for now
        action: "UPDATE",
        resource: "SCHOOL",
        resourceId: schoolIds.join(","),
        changes: {
          schoolCount: schoolIds.length,
          schoolNames: currentSchools.map(s => s.name),
          resetToState: {
            isOnboarded: false,
            onboardingStep: 0,
            onboardingCompletedAt: null,
          },
        },
        checksum: "bulk-reset-onboarding-" + Date.now(),
      },
    });

    try {
      revalidatePath("/super-admin/schools");
    } catch (error) {
      // Ignore revalidation errors in test environment
      if (process.env.NODE_ENV !== 'test') {
        console.warn("Failed to revalidate path:", error);
      }
    }
    
    return {
      success: true,
      message: `Successfully reset onboarding for ${schoolIds.length} schools`,
    };
  } catch (error) {
    console.error("Error bulk resetting onboarding:", error);
    return {
      success: false,
      error: "Failed to bulk reset onboarding",
    };
  }
}