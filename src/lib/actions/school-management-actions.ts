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

    // OPTIMIZED: Use more efficient query with selective includes
    const schools = await db.school.findMany({
      where,
      select: {
        id: true,
        name: true,
        schoolCode: true,
        email: true,
        phone: true,
        address: true,
        status: true,
        plan: true,
        isOnboarded: true,
        onboardingStep: true,
        onboardingCompletedAt: true,
        createdAt: true,
        updatedAt: true,
        domain: true,
        subdomain: true,
        tagline: true,
        logo: true,
        favicon: true,
        primaryColor: true,
        secondaryColor: true,
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
          select: {
            id: true,
            isActive: true,
            startDate: true,
            endDate: true,
            paymentStatus: true,
          },
        },
        administrators: {
          take: 1, // Only get the primary admin for overview
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' }, // Get the first admin created
        },
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

// ============================================================================
// SCHOOL SETTINGS MANAGEMENT ACTIONS
// ============================================================================

export interface SchoolSettingsData {
  name?: string;
  schoolCode?: string;
  email?: string;
  phone?: string;
  address?: string;
  domain?: string;
  subdomain?: string;
  tagline?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  plan?: "STARTER" | "GROWTH" | "DOMINATE";
}

export interface SchoolPermissionsData {
  canCreateUsers?: boolean;
  canManageRoles?: boolean;
  canAccessReports?: boolean;
  canManageBilling?: boolean;
  canExportData?: boolean;
  maxAdministrators?: number;
  maxTeachers?: number;
  maxStudents?: number;
}

export interface SchoolUsageLimitsData {
  whatsappLimit?: number;
  smsLimit?: number;
  storageLimitMB?: number;
  maxActiveUsers?: number;
  maxConcurrentSessions?: number;
}

export interface SchoolNotificationSettingsData {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  whatsappNotifications?: boolean;
  systemAlerts?: boolean;
  billingAlerts?: boolean;
  usageAlerts?: boolean;
  notificationEmail?: string;
  notificationPhone?: string;
}

export interface SchoolSecuritySettingsData {
  twoFactorRequired?: boolean;
  sessionTimeoutMinutes?: number;
  passwordPolicy?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  };
  ipWhitelist?: string[];
  allowedDomains?: string[];
}

/**
 * Update school basic settings
 */
export async function updateSchoolSettings(schoolId: string, data: SchoolSettingsData) {
  await requireSuperAdminAccess();

  try {
    // Get current school for logging
    const currentSchool = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        schoolCode: true,
        email: true,
        phone: true,
        address: true,
        domain: true,
        subdomain: true,
        tagline: true,
        logo: true,
        favicon: true,
        primaryColor: true,
        secondaryColor: true,
        plan: true,
      },
    });

    if (!currentSchool) {
      return {
        success: false,
        error: "School not found",
      };
    }

    // Validate school code uniqueness if changed
    if (data.schoolCode && data.schoolCode !== currentSchool.schoolCode) {
      const existingSchool = await db.school.findUnique({
        where: { schoolCode: data.schoolCode },
      });

      if (existingSchool) {
        return {
          success: false,
          error: "School code already exists",
        };
      }
    }

    // Validate subdomain uniqueness if changed
    if (data.subdomain && data.subdomain !== currentSchool.subdomain) {
      const existingSubdomain = await db.school.findUnique({
        where: { subdomain: data.subdomain },
      });

      if (existingSubdomain) {
        return {
          success: false,
          error: "Subdomain already exists",
        };
      }
    }

    // Update school
    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: null,
        action: "UPDATE",
        resource: "SCHOOL",
        resourceId: schoolId,
        changes: {
          schoolName: currentSchool.name,
          previousData: currentSchool,
          newData: data,
        } as any,
        checksum: "update-settings-" + Date.now(),
      },
    });

    revalidatePath("/super-admin/schools");
    revalidatePath(`/super-admin/schools/${schoolId}`);

    return {
      success: true,
      data: updatedSchool,
      message: "School settings updated successfully",
    };
  } catch (error) {
    console.error("Error updating school settings:", error);
    return {
      success: false,
      error: "Failed to update school settings",
    };
  }
}

/**
 * Update school permissions
 */
export async function updateSchoolPermissions(schoolId: string, data: SchoolPermissionsData) {
  await requireSuperAdminAccess();

  try {
    // Store permissions in school metadata
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, metadata: true },
    });

    if (!school) {
      return {
        success: false,
        error: "School not found",
      };
    }

    const currentMetadata = (school.metadata as any) || {};
    const updatedMetadata = {
      ...currentMetadata,
      permissions: {
        ...currentMetadata.permissions,
        ...data,
      },
    };

    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        metadata: updatedMetadata,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: null,
        action: "UPDATE",
        resource: "SCHOOL_PERMISSIONS",
        resourceId: schoolId,
        changes: {
          schoolName: school.name,
          previousPermissions: currentMetadata.permissions || {},
          newPermissions: data,
        } as any,
        checksum: "update-permissions-" + Date.now(),
      },
    });

    revalidatePath("/super-admin/schools");
    revalidatePath(`/super-admin/schools/${schoolId}/settings`);

    return {
      success: true,
      data: updatedSchool,
      message: "School permissions updated successfully",
    };
  } catch (error) {
    console.error("Error updating school permissions:", error);
    return {
      success: false,
      error: "Failed to update school permissions",
    };
  }
}

/**
 * Update school usage limits
 */
export async function updateSchoolUsageLimits(schoolId: string, data: SchoolUsageLimitsData) {
  await requireSuperAdminAccess();

  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, metadata: true },
    });

    if (!school) {
      return {
        success: false,
        error: "School not found",
      };
    }

    const currentMetadata = (school.metadata as any) || {};
    const updatedMetadata = {
      ...currentMetadata,
      usageLimits: {
        ...currentMetadata.usageLimits,
        ...data,
      },
    };

    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        metadata: updatedMetadata,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: null,
        action: "UPDATE",
        resource: "SCHOOL_USAGE_LIMITS",
        resourceId: schoolId,
        changes: {
          schoolName: school.name,
          previousLimits: currentMetadata.usageLimits || {},
          newLimits: data,
        } as any,
        checksum: "update-usage-limits-" + Date.now(),
      },
    });

    revalidatePath("/super-admin/schools");
    revalidatePath(`/super-admin/schools/${schoolId}/settings`);

    return {
      success: true,
      data: updatedSchool,
      message: "School usage limits updated successfully",
    };
  } catch (error) {
    console.error("Error updating school usage limits:", error);
    return {
      success: false,
      error: "Failed to update school usage limits",
    };
  }
}

/**
 * Update school notification settings
 */
export async function updateSchoolNotificationSettings(schoolId: string, data: SchoolNotificationSettingsData) {
  await requireSuperAdminAccess();

  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, metadata: true },
    });

    if (!school) {
      return {
        success: false,
        error: "School not found",
      };
    }

    const currentMetadata = (school.metadata as any) || {};
    const updatedMetadata = {
      ...currentMetadata,
      notificationSettings: {
        ...currentMetadata.notificationSettings,
        ...data,
      },
    };

    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        metadata: updatedMetadata,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: null,
        action: "UPDATE",
        resource: "SCHOOL_NOTIFICATION_SETTINGS",
        resourceId: schoolId,
        changes: {
          schoolName: school.name,
          previousSettings: currentMetadata.notificationSettings || {},
          newSettings: data,
        } as any,
        checksum: "update-notification-settings-" + Date.now(),
      },
    });

    revalidatePath("/super-admin/schools");
    revalidatePath(`/super-admin/schools/${schoolId}/settings`);

    return {
      success: true,
      data: updatedSchool,
      message: "School notification settings updated successfully",
    };
  } catch (error) {
    console.error("Error updating school notification settings:", error);
    return {
      success: false,
      error: "Failed to update school notification settings",
    };
  }
}

/**
 * Update school security settings
 */
export async function updateSchoolSecuritySettings(schoolId: string, data: SchoolSecuritySettingsData) {
  await requireSuperAdminAccess();

  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, metadata: true },
    });

    if (!school) {
      return {
        success: false,
        error: "School not found",
      };
    }

    const currentMetadata = (school.metadata as any) || {};
    const updatedMetadata = {
      ...currentMetadata,
      securitySettings: {
        ...currentMetadata.securitySettings,
        ...data,
      },
    };

    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        metadata: updatedMetadata,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: null,
        action: "UPDATE",
        resource: "SCHOOL_SECURITY_SETTINGS",
        resourceId: schoolId,
        changes: {
          schoolName: school.name,
          previousSettings: currentMetadata.securitySettings || {},
          newSettings: data,
        } as any,
        checksum: "update-security-settings-" + Date.now(),
      },
    });

    revalidatePath("/super-admin/schools");
    revalidatePath(`/super-admin/schools/${schoolId}/settings`);

    return {
      success: true,
      data: updatedSchool,
      message: "School security settings updated successfully",
    };
  } catch (error) {
    console.error("Error updating school security settings:", error);
    return {
      success: false,
      error: "Failed to update school security settings",
    };
  }
}

// ============================================================================
// SCHOOL VIEW DETAILS ACTIONS
// ============================================================================

/**
 * Get comprehensive school analytics
 */
export async function getSchoolAnalytics(schoolId: string) {
  await requireSuperAdminAccess();

  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            administrators: true,
            teachers: true,
            students: true,
            Announcement: true,
            Event: true,
            Course: true,
            classes: true,
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

    // Get usage metrics for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const usageMetrics = await db.usageCounter.findMany({
      where: {
        schoolId,
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    // Get recent activity (audit logs)
    const recentActivity = await db.auditLog.findMany({
      where: {
        OR: [
          { resourceId: schoolId },
          { changes: { path: ['schoolId'], equals: schoolId } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        action: true,
        resource: true,
        createdAt: true,
        changes: true,
      },
    });

    // Get subscription history
    const subscriptions = await db.subscription.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        isActive: true,
        startDate: true,
        endDate: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: {
        school,
        metrics: {
          totalUsers: school._count.administrators + school._count.teachers + school._count.students,
          administrators: school._count.administrators,
          teachers: school._count.teachers,
          students: school._count.students,
          announcements: school._count.Announcement,
          events: school._count.Event,
          courses: school._count.Course,
          classes: school._count.classes,
        },
        usageMetrics,
        recentActivity,
        subscriptions,
      },
    };
  } catch (error) {
    console.error("Error fetching school analytics:", error);
    return {
      success: false,
      error: "Failed to fetch school analytics",
    };
  }
}

/**
 * Get school usage metrics
 */
export async function getSchoolUsageMetrics(schoolId: string) {
  await requireSuperAdminAccess();

  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        metadata: true,
      },
    });

    if (!school) {
      return {
        success: false,
        error: "School not found",
      };
    }

    // Get current month usage
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const currentUsage = await db.usageCounter.findFirst({
      where: {
        schoolId,
        month: currentMonth.toISOString().substring(0, 7), // YYYY-MM format
      },
    });

    // Get usage history for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const usageHistory = await db.usageCounter.findMany({
      where: {
        schoolId,
        createdAt: {
          gte: twelveMonthsAgo,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get limits from metadata
    const metadata = (school.metadata as any) || {};
    const usageLimits = metadata.usageLimits || {};

    return {
      success: true,
      data: {
        school: {
          id: school.id,
          name: school.name,
        },
        currentUsage: currentUsage || {
          whatsappUsed: 0,
          smsUsed: 0,
          storageUsedMB: 0,
        },
        limits: {
          whatsappLimit: usageLimits.whatsappLimit || 1000,
          smsLimit: usageLimits.smsLimit || 500,
          storageLimitMB: usageLimits.storageLimitMB || 1024,
        },
        usageHistory,
      },
    };
  } catch (error) {
    console.error("Error fetching school usage metrics:", error);
    return {
      success: false,
      error: "Failed to fetch school usage metrics",
    };
  }
}

/**
 * Get school activity log
 */
export async function getSchoolActivityLog(schoolId: string, limit: number = 50) {
  await requireSuperAdminAccess();

  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true },
    });

    if (!school) {
      return {
        success: false,
        error: "School not found",
      };
    }

    const activities = await db.auditLog.findMany({
      where: {
        OR: [
          { resourceId: schoolId },
          { changes: { path: ['schoolId'], equals: schoolId } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        userId: true,
        action: true,
        resource: true,
        resourceId: true,
        changes: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        school: {
          id: school.id,
          name: school.name,
        },
        activities,
      },
    };
  } catch (error) {
    console.error("Error fetching school activity log:", error);
    return {
      success: false,
      error: "Failed to fetch school activity log",
    };
  }
}

/**
 * Get school security status
 */
export async function getSchoolSecurityStatus(schoolId: string) {
  await requireSuperAdminAccess();

  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        metadata: true,
        sslConfigured: true,
        dnsConfigured: true,
      },
    });

    if (!school) {
      return {
        success: false,
        error: "School not found",
      };
    }

    const metadata = (school.metadata as any) || {};
    const securitySettings = metadata.securitySettings || {};

    // Get recent security-related audit logs
    const securityLogs = await db.auditLog.findMany({
      where: {
        OR: [
          { resourceId: schoolId },
          { changes: { path: ['schoolId'], equals: schoolId } },
        ],
        resource: {
          in: ['SCHOOL_SECURITY_SETTINGS', 'USER_LOGIN', 'USER_LOGOUT', 'PASSWORD_CHANGE'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        action: true,
        resource: true,
        createdAt: true,
        changes: true,
      },
    });

    // Calculate security score
    let securityScore = 0;
    const maxScore = 100;

    // SSL configured
    if (school.sslConfigured) securityScore += 20;

    // DNS configured
    if (school.dnsConfigured) securityScore += 10;

    // Two-factor authentication
    if (securitySettings.twoFactorRequired) securityScore += 25;

    // Password policy
    if (securitySettings.passwordPolicy) {
      const policy = securitySettings.passwordPolicy;
      if (policy.minLength >= 8) securityScore += 10;
      if (policy.requireUppercase && policy.requireLowercase) securityScore += 10;
      if (policy.requireNumbers) securityScore += 10;
      if (policy.requireSpecialChars) securityScore += 10;
    }

    // Session timeout
    if (securitySettings.sessionTimeoutMinutes && securitySettings.sessionTimeoutMinutes <= 60) {
      securityScore += 5;
    }

    return {
      success: true,
      data: {
        school: {
          id: school.id,
          name: school.name,
        },
        securityScore,
        maxScore,
        securitySettings,
        infrastructure: {
          sslConfigured: school.sslConfigured,
          dnsConfigured: school.dnsConfigured,
        },
        recentSecurityLogs: securityLogs,
      },
    };
  } catch (error) {
    console.error("Error fetching school security status:", error);
    return {
      success: false,
      error: "Failed to fetch school security status",
    };
  }
}

// ============================================================================
// SCHOOL DATA MANAGEMENT ACTIONS
// ============================================================================

/**
 * Export school data
 */
export async function exportSchoolData(schoolId: string, format: 'json' | 'csv' = 'json') {
  await requireSuperAdminAccess();

  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      include: {
        administrators: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        teachers: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        students: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        classes: true,
        Course: true,
        Announcement: true,
        Event: true,
        subscriptions: true,
        usageCounters: true,
      },
    });

    if (!school) {
      return {
        success: false,
        error: "School not found",
      };
    }

    // Log the export action
    await db.auditLog.create({
      data: {
        userId: null,
        action: "EXPORT",
        resource: "SCHOOL_DATA",
        resourceId: schoolId,
        changes: {
          schoolName: school.name,
          format,
          exportedAt: new Date(),
        },
        checksum: "export-data-" + Date.now(),
      },
    });

    return {
      success: true,
      data: {
        school,
        exportedAt: new Date(),
        format,
      },
      message: "School data exported successfully",
    };
  } catch (error) {
    console.error("Error exporting school data:", error);
    return {
      success: false,
      error: "Failed to export school data",
    };
  }
}

/**
 * Get school data retention policy
 */
export async function getSchoolDataRetentionPolicy(schoolId: string) {
  await requireSuperAdminAccess();

  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        metadata: true,
      },
    });

    if (!school) {
      return {
        success: false,
        error: "School not found",
      };
    }

    const metadata = (school.metadata as any) || {};
    const dataRetentionPolicy = metadata.dataRetentionPolicy || {
      auditLogRetentionDays: 365,
      userDataRetentionDays: 2555, // 7 years
      academicDataRetentionDays: 3650, // 10 years
      financialDataRetentionDays: 2555, // 7 years
      autoDeleteInactiveUsers: false,
      autoDeleteOldAuditLogs: true,
    };

    return {
      success: true,
      data: {
        school: {
          id: school.id,
          name: school.name,
        },
        dataRetentionPolicy,
      },
    };
  } catch (error) {
    console.error("Error fetching data retention policy:", error);
    return {
      success: false,
      error: "Failed to fetch data retention policy",
    };
  }
}

/**
 * Update school data retention policy
 */
export async function updateSchoolDataRetentionPolicy(schoolId: string, policy: any) {
  await requireSuperAdminAccess();

  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        metadata: true,
      },
    });

    if (!school) {
      return {
        success: false,
        error: "School not found",
      };
    }

    const currentMetadata = (school.metadata as any) || {};
    const updatedMetadata = {
      ...currentMetadata,
      dataRetentionPolicy: {
        ...currentMetadata.dataRetentionPolicy,
        ...policy,
      },
    };

    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        metadata: updatedMetadata,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: null,
        action: "UPDATE",
        resource: "SCHOOL_DATA_RETENTION_POLICY",
        resourceId: schoolId,
        changes: {
          schoolName: school.name,
          previousPolicy: currentMetadata.dataRetentionPolicy || {},
          newPolicy: policy,
        },
        checksum: "update-retention-policy-" + Date.now(),
      },
    });

    revalidatePath("/super-admin/schools");
    revalidatePath(`/super-admin/schools/${schoolId}/settings`);

    return {
      success: true,
      data: updatedSchool,
      message: "Data retention policy updated successfully",
    };
  } catch (error) {
    console.error("Error updating data retention policy:", error);
    return {
      success: false,
      error: "Failed to update data retention policy",
    };
  }
}

// ============================================================================
// DANGER ZONE ACTIONS
// ============================================================================

/**
 * Reset all school data (Factory Reset)
 * Clears all operational data but keeps school and administrators
 */
export async function resetSchoolData(schoolId: string) {
  await requireSuperAdminAccess();

  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      include: {
        administrators: {
          select: { userId: true }
        }
      }
    });

    if (!school) {
      return { success: false, error: "School not found" };
    }

    // 1. Identify Users to delete (Students, Teachers, Parents)
    // We fetch IDs first to ensure we don't accidentally delete Admins or unrelated users
    const [studentUsers, teacherUsers, parentUsers] = await Promise.all([
      db.student.findMany({ where: { schoolId }, select: { userId: true } }),
      db.teacher.findMany({ where: { schoolId }, select: { userId: true } }),
      db.parent.findMany({ where: { schoolId }, select: { userId: true } }),
    ]);

    const userIdsToDelete = [
      ...studentUsers.map(u => u.userId),
      ...teacherUsers.map(u => u.userId),
      ...parentUsers.map(u => u.userId),
    ].filter(Boolean); // Remove nulls

    // Execute huge transaction
    await db.$transaction(async (tx) => {
      // Delete Operational Data (Order matters for some, but Cascade handles most)
      // We delete top-level entities relative to school

      // 1. Academic Structure
      // Deleting Classes (cascades Enrollments, Assignments, etc.)
      await tx.class.deleteMany({ where: { schoolId } });
      // Deleting Academic Years (cascades Terms, etc.)
      await tx.academicYear.deleteMany({ where: { schoolId } });
      // Deleting Departments
      await tx.department.deleteMany({ where: { schoolId } });

      // 2. People & Users
      // Delete profiles explicitly first (though user delete would cascade, this is cleaner)
      await tx.student.deleteMany({ where: { schoolId } });
      await tx.teacher.deleteMany({ where: { schoolId } });
      await tx.parent.deleteMany({ where: { schoolId } });
      await tx.driver.deleteMany({ where: { schoolId } });

      // Delete the actual User accounts
      if (userIdsToDelete.length > 0) {
        await tx.user.deleteMany({
          where: { id: { in: userIdsToDelete } }
        });
      }

      // 3. Modules
      await tx.transportAttendance.deleteMany({ where: { schoolId } }); // If not cascaded
      await tx.route.deleteMany({ where: { schoolId } });
      await tx.vehicle.deleteMany({ where: { schoolId } });

      await tx.hostel.deleteMany({ where: { schoolId } });
      await tx.book.deleteMany({ where: { schoolId } }); // Library

      // 4. Communication
      await tx.announcement.deleteMany({ where: { schoolId } });
      await tx.event.deleteMany({ where: { schoolId } });
      await tx.message.deleteMany({ where: { schoolId } }); // If stored with schoolId

      // 5. Finance (Keep Subscriptions)
      await tx.feePayment.deleteMany({ where: { schoolId } });
      await tx.feeStructure.deleteMany({ where: { schoolId } });
      await tx.expense.deleteMany({ where: { schoolId } });
      await tx.payroll.deleteMany({ where: { schoolId } });

      // 6. Reset School State
      await tx.school.update({
        where: { id: schoolId },
        data: {
          isOnboarded: false,
          onboardingStep: 1, // Ready for wizard
          onboardingCompletedAt: null,
          updatedAt: new Date(),
        }
      });

      // Log Action
      await tx.auditLog.create({
        data: {
          action: "UPDATE", // Changed from RESET to UPDATE
          resource: "SCHOOL",
          resourceId: schoolId,
          changes: {
            description: "Factory Reset performed. All operational data cleared.",
            deletedUsersCount: userIdsToDelete.length,
          },
          checksum: "reset-school-" + Date.now(),
        }
      });
    }, {
      maxWait: 10000, // 10s max wait
      timeout: 20000  // 20s timeout for large data
    });

    revalidatePath("/super-admin/schools");
    revalidatePath(`/super-admin/schools/${schoolId}`);

    return {
      success: true,
      message: "School data reset successfully. System is ready for setup.",
    };

  } catch (error) {
    console.error("Error resetting school data:", error);
    return {
      success: false,
      error: "Failed to reset school data. Please try again or delete the school entirely.",
    };
  }
}

/**
 * Permanently Delete School
 * Deletes School entity and all related data including Administrators
 */
export async function deleteSchool(schoolId: string) {
  await requireSuperAdminAccess();

  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      include: {
        administrators: { select: { userId: true } },
        students: { select: { userId: true } },
        teachers: { select: { userId: true } },
        parents: { select: { userId: true } }, // Parents might not have directschool link on User, but Parent entity does
      }
    });

    if (!school) {
      return { success: false, error: "School not found" };
    }

    // Identify ALL users to delete (including Admins)
    const adminUserIds = school.administrators.map(a => a.userId);
    const studentUserIds = school.students.map(s => s.userId);
    const teacherUserIds = school.teachers.map(t => t.userId);
    const parentUserIds = school.parents.map(p => p.userId);

    // Driver doesn't have userId, so we don't include it in user deletion

    const allUserIdsToDelete = [
      ...adminUserIds,
      ...studentUserIds,
      ...teacherUserIds,
      ...parentUserIds,
    ].filter(Boolean);

    await db.$transaction(async (tx) => {
      // Delete School (Cascades to almost everything: Classes, Students, etc.)
      await tx.school.delete({
        where: { id: schoolId }
      });

      // Manually cleanup Users (since User -> School is relation, but User existence is independent usually)
      if (allUserIdsToDelete.length > 0) {
        await tx.user.deleteMany({
          where: { id: { in: allUserIdsToDelete } }
        });
      }

      await tx.auditLog.create({
        data: {
          action: "DELETE",
          resource: "SCHOOL",
          resourceId: schoolId,
          changes: {
            name: school.name,
            deletedUsersCount: allUserIdsToDelete.length,
          },
          checksum: "delete-school-" + Date.now(),
        }
      });
    });

    revalidatePath("/super-admin/schools");

    return {
      success: true,
      message: "School and all associated data deleted successfully.",
    };

  } catch (error) {
    console.error("Error deleting school:", error);
    return {
      success: false,
      error: "Failed to delete school.",
    };
  }
}