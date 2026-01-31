import { db } from "@/lib/db";
import { School, SchoolStatus, PlanType, UserRole, Prisma } from "@prisma/client";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";

// Types for school management operations
export interface SchoolCreateData {
  name: string;
  schoolCode: string;
  phone?: string;
  email?: string;
  address?: string;
  domain?: string;
  subdomain?: string;
  plan?: PlanType;
  tagline?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface SchoolUpdateData {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  domain?: string;
  subdomain?: string;
  plan?: PlanType;
  tagline?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status?: SchoolStatus;
}

export interface SchoolBulkOperation {
  schoolIds: string[];
  operation: 'suspend' | 'activate' | 'update_plan' | 'delete';
  data?: {
    status?: SchoolStatus;
    plan?: PlanType;
    reason?: string;
  };
}

export interface SchoolUserManagement {
  schoolId: string;
  userId: string;
  role: string;
  isActive?: boolean;
}

export interface SchoolSearchFilters {
  name?: string;
  schoolCode?: string;
  email?: string;
  status?: SchoolStatus;
  plan?: PlanType;
  createdAfter?: Date;
  createdBefore?: Date;
  hasActiveSubscription?: boolean;
  usageThreshold?: {
    type: 'whatsapp' | 'sms' | 'storage';
    operator: 'gt' | 'lt' | 'eq';
    value: number;
  };
  userCountRange?: {
    min?: number;
    max?: number;
  };
  domain?: string;
  isOnboarded?: boolean;
  lastActivityAfter?: Date;
  lastActivityBefore?: Date;
}

export interface SchoolWithDetails extends School {
  _count: {
    students: number;
    teachers: number;
    administrators: number;
    usageCounters: number;
    enhancedSubscriptions: number;
  };
  usageCounters?: Array<{
    month: string;
    whatsappUsed: number;
    smsUsed: number;
    storageUsedMB: number;
    whatsappLimit: number;
    smsLimit: number;
    storageLimitMB: number;
  }>;
  enhancedSubscriptions?: Array<{
    id: string;
    status: string;
    currentPeriodEnd: Date;
    plan: {
      name: string;
      amount: number;
    };
  }>;
}

/**
 * Advanced School Management Service
 * Provides comprehensive school management capabilities for super-admin dashboard
 */
export class SchoolService {
  /**
   * Create a new school with validation
   * Requirements: 3.1 - Comprehensive school editing with validation
   */
  async createSchool(data: SchoolCreateData): Promise<School> {
    // Ensure super admin access
    await requireSuperAdminAccess();

    // Validate required fields
    if (!data.name || !data.schoolCode) {
      throw new Error("School name and code are required");
    }

    // Validate school code uniqueness
    const existingSchool = await db.school.findUnique({
      where: { schoolCode: data.schoolCode }
    });

    if (existingSchool) {
      throw new Error(`School code '${data.schoolCode}' already exists`);
    }

    // Validate email format if provided
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error("Invalid email format");
    }

    // Validate domain format if provided
    if (data.domain && !this.isValidDomain(data.domain)) {
      throw new Error("Invalid domain format");
    }

    // Create school with default values
    const school = await db.school.create({
      data: {
        name: data.name,
        schoolCode: data.schoolCode,
        phone: data.phone,
        email: data.email,
        address: data.address,
        domain: data.domain,
        subdomain: data.subdomain,
        plan: data.plan || PlanType.STARTER,
        status: SchoolStatus.ACTIVE,
        tagline: data.tagline,
        logo: data.logo,
        favicon: data.favicon,
        primaryColor: data.primaryColor || "#3b82f6",
        secondaryColor: data.secondaryColor || "#8b5cf6",
        isOnboarded: false,
        onboardingStep: 0,
      }
    });

    return school;
  }

  /**
   * Update school information with comprehensive validation
   * Requirements: 3.1 - Comprehensive school editing with validation
   */
  async updateSchool(schoolId: string, data: SchoolUpdateData): Promise<School> {
    // Ensure super admin access
    await requireSuperAdminAccess();

    // Validate school exists
    const existingSchool = await db.school.findUnique({
      where: { id: schoolId }
    });

    if (!existingSchool) {
      throw new Error(`School not found: ${schoolId}`);
    }

    // Validate email format if provided
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error("Invalid email format");
    }

    // Validate domain format if provided
    if (data.domain && !this.isValidDomain(data.domain)) {
      throw new Error("Invalid domain format");
    }

    // Update school
    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        ...data,
        updatedAt: new Date(),
      }
    });

    return updatedSchool;
  }

  /**
   * Perform bulk operations on multiple schools
   * Requirements: 3.2 - Bulk operations for school management
   */
  async performBulkOperation(operation: SchoolBulkOperation): Promise<{
    success: number;
    failed: number;
    errors: Array<{ schoolId: string; error: string }>;
  }> {
    // Ensure super admin access
    await requireSuperAdminAccess();

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ schoolId: string; error: string }>
    };

    // Validate school IDs exist
    const existingSchools = await db.school.findMany({
      where: { id: { in: operation.schoolIds } },
      select: { id: true, status: true }
    });

    const existingSchoolIds = existingSchools.map(s => s.id);
    const missingSchoolIds = operation.schoolIds.filter(id => !existingSchoolIds.includes(id));

    // Add errors for missing schools
    missingSchoolIds.forEach(id => {
      results.errors.push({ schoolId: id, error: "School not found" });
      results.failed++;
    });

    // Process existing schools
    for (const school of existingSchools) {
      try {
        switch (operation.operation) {
          case 'suspend':
            await this.suspendSchool(school.id, operation.data?.reason);
            results.success++;
            break;

          case 'activate':
            await this.activateSchool(school.id);
            results.success++;
            break;

          case 'update_plan':
            if (!operation.data?.plan) {
              throw new Error("Plan is required for update_plan operation");
            }
            await db.school.update({
              where: { id: school.id },
              data: { plan: operation.data.plan }
            });
            results.success++;
            break;

          case 'delete':
            await this.deleteSchool(school.id);
            results.success++;
            break;

          default:
            throw new Error(`Unknown operation: ${operation.operation}`);
        }
      } catch (error: any) {
        results.errors.push({ 
          schoolId: school.id, 
          error: error.message || "Unknown error" 
        });
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Manage users within a school context
   * Requirements: 3.3 - School user management within tenant context
   */
  async manageSchoolUser(operation: SchoolUserManagement): Promise<void> {
    // Ensure super admin access
    await requireSuperAdminAccess();

    // Validate school exists
    const school = await db.school.findUnique({
      where: { id: operation.schoolId }
    });

    if (!school) {
      throw new Error(`School not found: ${operation.schoolId}`);
    }

    // Validate user exists
    const user = await db.user.findUnique({
      where: { id: operation.userId }
    });

    if (!user) {
      throw new Error(`User not found: ${operation.userId}`);
    }

    // Check if user-school relationship exists
    const existingRelation = await db.userSchool.findUnique({
      where: {
        userId_schoolId: {
          userId: operation.userId,
          schoolId: operation.schoolId
        }
      }
    });

    if (existingRelation) {
      // Update existing relationship
      await db.userSchool.update({
        where: {
          userId_schoolId: {
            userId: operation.userId,
            schoolId: operation.schoolId
          }
        },
        data: {
          role: operation.role as any,
          isActive: operation.isActive ?? true,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new relationship
      await db.userSchool.create({
        data: {
          userId: operation.userId,
          schoolId: operation.schoolId,
          role: operation.role as any,
          isActive: operation.isActive ?? true
        }
      });
    }
  }

  /**
   * Get comprehensive school users with roles
   * Requirements: 3.3 - School user management within tenant context
   */
  async getSchoolUsers(schoolId: string): Promise<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  }>> {
    // Ensure super admin access
    await requireSuperAdminAccess();

    const schoolUsers = await db.userSchool.findMany({
      where: { schoolId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            lastLoginAt: true,
            createdAt: true
          }
        }
      }
    });

    return schoolUsers.map(relation => ({
      id: relation.user.id,
      name: relation.user.name || 'Unknown',
      email: relation.user.email || '',
      role: relation.role as string,
      isActive: relation.isActive,
      lastLoginAt: relation.user.lastLoginAt,
      createdAt: relation.user.createdAt
    }));
  }

  /**
   * Gracefully suspend a school with data preservation
   * Requirements: 3.5 - Graceful school suspension with data preservation
   * Requirements: 10.2 - Authentication impact when school is suspended
   */
  async suspendSchool(schoolId: string, reason?: string): Promise<School> {
    // Ensure super admin access
    await requireSuperAdminAccess();

    // Validate school exists and is not already suspended
    const school = await db.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      throw new Error(`School not found: ${schoolId}`);
    }

    if (school.status === SchoolStatus.SUSPENDED) {
      throw new Error("School is already suspended");
    }

    // Suspend school while preserving all data
    const suspendedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        status: SchoolStatus.SUSPENDED,
        updatedAt: new Date()
      }
    });

    // Deactivate all user-school relationships for this school
    await db.userSchool.updateMany({
      where: { schoolId },
      data: { isActive: false }
    });

    // Invalidate all active sessions for this school
    try {
      const { schoolContextService } = await import('./school-context-service');
      const sessionResult = await schoolContextService.invalidateSchoolSessions(
        schoolId, 
        reason || 'School suspended by super admin'
      );

      // Log the suspension with session invalidation details
      await db.auditLog.create({
        data: {
          userId: null,
          action: "UPDATE" as any,
          resource: "SCHOOL",
          resourceId: schoolId,
          changes: {
            oldStatus: school.status,
            newStatus: SchoolStatus.SUSPENDED,
            reason: reason || 'No reason provided',
            invalidatedSessions: sessionResult.invalidatedSessions,
            affectedUsers: sessionResult.affectedUsers,
            schoolName: school.name,
            suspendedAt: new Date()
          },
          checksum: "suspend-school-" + Date.now(),
        },
      });

    } catch (error) {
      console.error('Error invalidating sessions during school suspension:', error);
      
      // Still log the suspension even if session invalidation fails
      await db.auditLog.create({
        data: {
          userId: null,
          action: "UPDATE" as any,
          resource: "SCHOOL",
          resourceId: schoolId,
          changes: {
            oldStatus: school.status,
            newStatus: SchoolStatus.SUSPENDED,
            reason: reason || 'No reason provided',
            schoolName: school.name,
            suspendedAt: new Date(),
            sessionInvalidationError: error instanceof Error ? error.message : 'Unknown error'
          },
          checksum: "suspend-school-" + Date.now(),
        },
      });
    }

    return suspendedSchool;
  }

  /**
   * Activate a suspended school
   * Requirements: 3.5 - Graceful school suspension with data preservation
   */
  async activateSchool(schoolId: string): Promise<School> {
    // Ensure super admin access
    await requireSuperAdminAccess();

    // Validate school exists and is suspended
    const school = await db.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      throw new Error(`School not found: ${schoolId}`);
    }

    if (school.status === SchoolStatus.ACTIVE) {
      throw new Error("School is already active");
    }

    // Activate school
    const activatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        status: SchoolStatus.ACTIVE,
        updatedAt: new Date()
      }
    });

    // Reactivate user-school relationships
    await db.userSchool.updateMany({
      where: { schoolId },
      data: { isActive: true }
    });

    return activatedSchool;
  }

  /**
   * Reactivate a suspended school (alias for activateSchool for API compatibility)
   * Requirements: 10.2 - Super admin should activate or suspend school accounts
   */
  async reactivateSchool(schoolId: string, data?: { reason?: string; notifyUsers?: boolean }): Promise<School> {
    // Ensure super admin access
    await requireSuperAdminAccess();

    // Validate school exists and is suspended
    const school = await db.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      throw new Error(`School not found: ${schoolId}`);
    }

    if (school.status === SchoolStatus.ACTIVE) {
      throw new Error("School is already active");
    }

    // Reactivate school
    const reactivatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        status: SchoolStatus.ACTIVE,
        updatedAt: new Date()
      }
    });

    // Reactivate user-school relationships
    await db.userSchool.updateMany({
      where: { schoolId },
      data: { isActive: true }
    });

    // Log the reactivation
    await db.auditLog.create({
      data: {
        userId: null, // Super admin actions don't require specific user ID for now
        action: "UPDATE" as any,
        resource: "SCHOOL",
        resourceId: schoolId,
        changes: {
          oldStatus: school.status,
          newStatus: SchoolStatus.ACTIVE,
          reason: data?.reason,
          notifyUsers: data?.notifyUsers || false,
        },
        checksum: "reactivate-school-" + Date.now(),
      },
    });

    return reactivatedSchool;
  }

  /**
   * Bulk suspend multiple schools
   * Requirements: 10.2 - Super admin should activate or suspend school accounts
   */
  async bulkSuspendSchools(schoolIds: string[], reason?: string): Promise<{
    success: number;
    failed: number;
    errors: Array<{ schoolId: string; error: string }>;
  }> {
    await requireSuperAdminAccess();

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ schoolId: string; error: string }>
    };

    // Validate school IDs exist
    const existingSchools = await db.school.findMany({
      where: { id: { in: schoolIds } },
      select: { id: true, status: true, name: true }
    });

    const existingSchoolIds = existingSchools.map(s => s.id);
    const missingSchoolIds = schoolIds.filter(id => !existingSchoolIds.includes(id));

    // Add errors for missing schools
    missingSchoolIds.forEach(id => {
      results.errors.push({ schoolId: id, error: "School not found" });
      results.failed++;
    });

    // Process existing schools
    for (const school of existingSchools) {
      try {
        if (school.status === SchoolStatus.SUSPENDED) {
          results.errors.push({ schoolId: school.id, error: "School is already suspended" });
          results.failed++;
          continue;
        }

        await this.suspendSchool(school.id, reason);
        results.success++;
      } catch (error: any) {
        results.errors.push({ 
          schoolId: school.id, 
          error: error.message || "Unknown error" 
        });
        results.failed++;
      }
    }

    // Log bulk suspension
    await db.auditLog.create({
      data: {
        userId: null,
        action: "UPDATE" as any,
        resource: "SCHOOL",
        resourceId: schoolIds.join(","),
        changes: {
          schoolCount: schoolIds.length,
          successCount: results.success,
          failedCount: results.failed,
          reason,
          schoolNames: existingSchools.map(s => s.name),
        },
        checksum: "bulk-suspend-" + Date.now(),
      },
    });

    return results;
  }

  /**
   * Bulk reactivate multiple schools
   * Requirements: 10.2 - Super admin should activate or suspend school accounts
   */
  async bulkReactivateSchools(schoolIds: string[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ schoolId: string; error: string }>;
  }> {
    await requireSuperAdminAccess();

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ schoolId: string; error: string }>
    };

    // Validate school IDs exist
    const existingSchools = await db.school.findMany({
      where: { id: { in: schoolIds } },
      select: { id: true, status: true, name: true }
    });

    const existingSchoolIds = existingSchools.map(s => s.id);
    const missingSchoolIds = schoolIds.filter(id => !existingSchoolIds.includes(id));

    // Add errors for missing schools
    missingSchoolIds.forEach(id => {
      results.errors.push({ schoolId: id, error: "School not found" });
      results.failed++;
    });

    // Process existing schools
    for (const school of existingSchools) {
      try {
        if (school.status === SchoolStatus.ACTIVE) {
          results.errors.push({ schoolId: school.id, error: "School is already active" });
          results.failed++;
          continue;
        }

        await this.reactivateSchool(school.id);
        results.success++;
      } catch (error: any) {
        results.errors.push({ 
          schoolId: school.id, 
          error: error.message || "Unknown error" 
        });
        results.failed++;
      }
    }

    // Log bulk reactivation
    await db.auditLog.create({
      data: {
        userId: null,
        action: "UPDATE" as any,
        resource: "SCHOOL",
        resourceId: schoolIds.join(","),
        changes: {
          schoolCount: schoolIds.length,
          successCount: results.success,
          failedCount: results.failed,
          schoolNames: existingSchools.map(s => s.name),
        },
        checksum: "bulk-reactivate-" + Date.now(),
      },
    });

    return results;
  }

  /**
   * Advanced search and filtering capabilities
   * Requirements: 3.6 - Advanced search and filtering capabilities
   */
  async searchSchools(
    filters: SchoolSearchFilters,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    schools: SchoolWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Ensure super admin access
    await requireSuperAdminAccess();

    // Build where clause
    const where: Prisma.SchoolWhereInput = {};

    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive'
      };
    }

    if (filters.schoolCode) {
      where.schoolCode = {
        contains: filters.schoolCode,
        mode: 'insensitive'
      };
    }

    if (filters.email) {
      where.email = {
        contains: filters.email,
        mode: 'insensitive'
      };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.plan) {
      where.plan = filters.plan;
    }

    if (filters.domain) {
      where.domain = {
        contains: filters.domain,
        mode: 'insensitive'
      };
    }

    if (filters.isOnboarded !== undefined) {
      where.isOnboarded = filters.isOnboarded;
    }

    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {};
      if (filters.createdAfter) {
        where.createdAt.gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        where.createdAt.lte = filters.createdBefore;
      }
    }

    if (filters.lastActivityAfter || filters.lastActivityBefore) {
      where.updatedAt = {};
      if (filters.lastActivityAfter) {
        where.updatedAt.gte = filters.lastActivityAfter;
      }
      if (filters.lastActivityBefore) {
        where.updatedAt.lte = filters.lastActivityBefore;
      }
    }

    if (filters.hasActiveSubscription !== undefined) {
      if (filters.hasActiveSubscription) {
        where.enhancedSubscriptions = {
          some: {
            status: 'ACTIVE'
          }
        };
      } else {
        where.enhancedSubscriptions = {
          none: {
            status: 'ACTIVE'
          }
        };
      }
    }

    if (filters.usageThreshold) {
      const { type, operator, value } = filters.usageThreshold;
      const field = type === 'whatsapp' ? 'whatsappUsed' : 
                   type === 'sms' ? 'smsUsed' : 'storageUsedMB';
      
      const operatorMap = {
        'gt': 'gt',
        'lt': 'lt',
        'eq': 'equals'
      } as const;

      where.usageCounters = {
        some: {
          [field]: {
            [operatorMap[operator]]: value
          }
        }
      };
    }

    // Get total count
    const total = await db.school.count({ where });

    // Get schools with details
    const schools = await db.school.findMany({
      where,
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            administrators: true,
            usageCounters: true,
            enhancedSubscriptions: true
          }
        },
        usageCounters: {
          orderBy: { month: 'desc' },
          take: 3 // Last 3 months
        },
        enhancedSubscriptions: {
          where: { status: 'ACTIVE' },
          include: {
            plan: {
              select: { name: true, amount: true }
            }
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    });

    // Filter by user count range if specified
    let filteredSchools = schools;
    if (filters.userCountRange) {
      filteredSchools = schools.filter(school => {
        const totalUsers = school._count.students + school._count.teachers + school._count.administrators;
        const { min, max } = filters.userCountRange!;
        
        if (min !== undefined && totalUsers < min) return false;
        if (max !== undefined && totalUsers > max) return false;
        
        return true;
      });
    }

    return {
      schools: filteredSchools as SchoolWithDetails[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get comprehensive school data retrieval
   * Requirements: 3.4 - Comprehensive school data retrieval
   */
  async getSchoolDetails(schoolId: string): Promise<SchoolWithDetails | null> {
    // Ensure super admin access
    await requireSuperAdminAccess();

    const school = await db.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            administrators: true,
            usageCounters: true,
            enhancedSubscriptions: true
          }
        },
        usageCounters: {
          orderBy: { month: 'desc' },
          take: 12 // Last 12 months
        },
        enhancedSubscriptions: {
          include: {
            plan: {
              select: { name: true, amount: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return school as SchoolWithDetails | null;
  }

  /**
   * Get school analytics and metrics
   * Requirements: 3.4 - Comprehensive school data retrieval
   */
  async getSchoolAnalytics(schoolId: string): Promise<{
    userGrowth: Array<{ month: string; students: number; teachers: number; administrators: number }>;
    usageTrends: Array<{ month: string; whatsapp: number; sms: number; storage: number }>;
    subscriptionHistory: Array<{ date: Date; status: string; plan: string; amount: number }>;
    onboardingProgress: {
      isOnboarded: boolean;
      currentStep: number;
      completedAt: Date | null;
    };
  }> {
    // Ensure super admin access
    await requireSuperAdminAccess();

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        isOnboarded: true,
        onboardingStep: true,
        onboardingCompletedAt: true
      }
    });

    if (!school) {
      throw new Error(`School not found: ${schoolId}`);
    }

    // Get usage trends
    const usageCounters = await db.usageCounter.findMany({
      where: { schoolId },
      orderBy: { month: 'desc' },
      take: 12
    });

    const usageTrends = usageCounters.map(counter => ({
      month: counter.month,
      whatsapp: counter.whatsappUsed,
      sms: counter.smsUsed,
      storage: counter.storageUsedMB
    }));

    // Get subscription history
    const subscriptions = await db.enhancedSubscription.findMany({
      where: { schoolId },
      include: {
        plan: {
          select: { name: true, amount: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const subscriptionHistory = subscriptions.map(sub => ({
      date: sub.createdAt,
      status: sub.status,
      plan: sub.plan.name,
      amount: sub.plan.amount
    }));

    // For user growth, we'd need to track historical data
    // This is a simplified version - in production, you'd want to track this over time
    const currentCounts = await db.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            administrators: true
          }
        }
      }
    });

    const userGrowth = [{
      month: new Date().toISOString().slice(0, 7), // Current month
      students: currentCounts?._count.students || 0,
      teachers: currentCounts?._count.teachers || 0,
      administrators: currentCounts?._count.administrators || 0
    }];

    return {
      userGrowth,
      usageTrends,
      subscriptionHistory,
      onboardingProgress: {
        isOnboarded: school.isOnboarded,
        currentStep: school.onboardingStep,
        completedAt: school.onboardingCompletedAt
      }
    };
  }

  /**
   * Get schools summary statistics
   * Requirements: 3.4 - Comprehensive school data retrieval
   */
  async getSchoolsSummary(): Promise<{
    total: number;
    active: number;
    suspended: number;
    byPlan: Record<PlanType, number>;
    totalUsers: {
      students: number;
      teachers: number;
      administrators: number;
    };
    recentActivity: Array<{
      schoolId: string;
      schoolName: string;
      activity: string;
      timestamp: Date;
    }>;
  }> {
    // Ensure super admin access
    await requireSuperAdminAccess();

    // Get basic counts
    const [total, active, suspended] = await Promise.all([
      db.school.count(),
      db.school.count({ where: { status: SchoolStatus.ACTIVE } }),
      db.school.count({ where: { status: SchoolStatus.SUSPENDED } })
    ]);

    // Get counts by plan
    const planCounts = await db.school.groupBy({
      by: ['plan'],
      _count: { plan: true }
    });

    const byPlan = planCounts.reduce((acc, item) => {
      acc[item.plan] = item._count.plan;
      return acc;
    }, {} as Record<PlanType, number>);

    // Ensure all plan types are represented
    Object.values(PlanType).forEach(plan => {
      if (!(plan in byPlan)) {
        byPlan[plan] = 0;
      }
    });

    // Get total user counts across all schools
    const userCounts = await db.school.findMany({
      select: {
        _count: {
          select: {
            students: true,
            teachers: true,
            administrators: true
          }
        }
      }
    });

    const totalUsers = userCounts.reduce(
      (acc, school) => ({
        students: acc.students + school._count.students,
        teachers: acc.teachers + school._count.teachers,
        administrators: acc.administrators + school._count.administrators
      }),
      { students: 0, teachers: 0, administrators: 0 }
    );

    // Get recent activity (simplified - in production, you'd have an activity log)
    const recentSchools = await db.school.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        updatedAt: true,
        status: true
      }
    });

    const recentActivity = recentSchools.map(school => ({
      schoolId: school.id,
      schoolName: school.name,
      activity: `School ${school.status.toLowerCase()}`,
      timestamp: school.updatedAt
    }));

    return {
      total,
      active,
      suspended,
      byPlan,
      totalUsers,
      recentActivity
    };
  }

  /**
   * Delete a school (with proper data cleanup)
   * Requirements: 3.2 - Bulk operations for school management
   */
  private async deleteSchool(schoolId: string): Promise<void> {
    // This is a dangerous operation - ensure proper validation
    const school = await db.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            administrators: true
          }
        }
      }
    });

    if (!school) {
      throw new Error(`School not found: ${schoolId}`);
    }

    // Prevent deletion of schools with active users
    const totalUsers = school._count.students + school._count.teachers + school._count.administrators;
    if (totalUsers > 0) {
      throw new Error(`Cannot delete school with ${totalUsers} active users. Please transfer or remove users first.`);
    }

    // Check for active subscriptions
    const activeSubscriptions = await db.enhancedSubscription.count({
      where: {
        schoolId,
        status: 'ACTIVE'
      }
    });

    if (activeSubscriptions > 0) {
      throw new Error("Cannot delete school with active subscriptions. Please cancel subscriptions first.");
    }

    // Delete school (cascade will handle related records)
    await db.school.delete({
      where: { id: schoolId }
    });
  }

  /**
   * Get schools with filters (for super admin dashboard)
   */
  async getSchools(filters: any): Promise<{ schools: SchoolWithDetails[]; total: number }> {
    await requireSuperAdminAccess();

    const where: any = {};

    // Apply filters
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { schoolCode: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.planType && filters.planType !== 'ALL') {
      where.plan = filters.planType;
    }

    if (filters.city) {
      where.address = { contains: filters.city, mode: 'insensitive' };
    }

    const [schools, total] = await Promise.all([
      db.school.findMany({
        where,
        include: {
          _count: {
            select: {
              students: true,
              teachers: true,
              administrators: true,
              usageCounters: true,
              enhancedSubscriptions: true,
            },
          },
        },
        orderBy: { [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      db.school.count({ where }),
    ]);

    return { schools, total };
  }

  /**
   * Create a school with SaaS configuration
   */
  async createSchoolWithSaasConfig(data: any): Promise<School> {
    await requireSuperAdminAccess();

    // Validate required fields
    if (!data.name || !data.schoolCode || !data.subdomain) {
      throw new Error("School name, code, and subdomain are required");
    }

    // Validate subdomain uniqueness
    const existingSchool = await db.school.findFirst({
      where: {
        OR: [
          { subdomain: data.subdomain },
          { schoolCode: data.schoolCode },
        ],
      },
    });

    if (existingSchool) {
      throw new Error("Subdomain or school code already exists");
    }

    // Create school with SaaS configuration
    const school = await db.school.create({
      data: {
        name: data.name,
        schoolCode: data.schoolCode,
        phone: data.phone,
        email: data.email,
        address: data.address,
        subdomain: data.subdomain,
        plan: data.plan || PlanType.STARTER,
        status: data.status || SchoolStatus.INACTIVE,
        isOnboarded: data.isOnboarded || false,
        onboardingStep: 0,
        primaryColor: "#3b82f6",
        secondaryColor: "#8b5cf6",
        // Store additional metadata
        ...(data.metadata && { 
          // We'll need to add a metadata field to the schema or store in a separate table
        }),
      },
    });

    // Initialize DNS and SSL setup in background
    this.initializeSubdomainInfrastructure(school.subdomain!, school.id);

    return school;
  }

  /**
   * Get school by subdomain
   */
  async getSchoolBySubdomain(subdomain: string): Promise<School | null> {
    return await db.school.findFirst({
      where: { subdomain },
    });
  }

  /**
   * Initialize subdomain infrastructure (DNS and SSL)
   */
  private async initializeSubdomainInfrastructure(subdomain: string, schoolId: string): Promise<void> {
    try {
      // Import services dynamically to avoid circular dependencies
      const { createDNSService } = await import('@/lib/services/dns-service');
      const { createSSLService } = await import('@/lib/services/ssl-service');

      const dnsService = createDNSService();
      const sslService = createSSLService();

      // Create DNS records
      if (dnsService) {
        console.log(`Creating DNS records for subdomain: ${subdomain}`);
        const dnsSuccess = await dnsService.createSubdomainRecords(subdomain);
        
        if (dnsSuccess) {
          // Wait for DNS propagation before requesting SSL
          setTimeout(async () => {
            const propagated = await dnsService.verifySubdomainPropagation(subdomain);
            if (propagated && sslService) {
              console.log(`Requesting SSL certificate for subdomain: ${subdomain}`);
              const certificate = await sslService.requestCertificate(subdomain);
              
              if (certificate) {
                await sslService.storeCertificate(certificate);
                await sslService.scheduleRenewal(certificate.domain, certificate.expiresAt);
                
                // Update school status to indicate infrastructure is ready
                await db.school.update({
                  where: { id: schoolId },
                  data: { 
                    status: SchoolStatus.ACTIVE,
                    // Add infrastructure status fields if they exist in schema
                  },
                });
              }
            }
          }, 60000); // Wait 1 minute for DNS propagation
        }
      }

      // Log infrastructure setup
      await db.auditLog.create({
        data: {
          userId: "system",
          action: "CREATE",
          resource: "SUBDOMAIN_INFRASTRUCTURE",
          resourceId: schoolId,
          changes: {
            subdomain,
            dnsConfigured: !!dnsService,
            sslConfigured: !!sslService,
          },
          checksum: `subdomain-setup-${Date.now()}`,
        },
      });
    } catch (error) {
      console.error('Error initializing subdomain infrastructure:', error);
      
      // Log the error
      await db.auditLog.create({
        data: {
          userId: "system",
          action: "CREATE" as any,
          resource: "SUBDOMAIN_INFRASTRUCTURE",
          resourceId: schoolId,
          changes: {
            subdomain,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          checksum: `subdomain-error-${Date.now()}`,
        },
      });
    }
  }

  /**
   * Get school by ID
   */
  async getSchoolById(schoolId: string): Promise<SchoolWithDetails | null> {
    return await db.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            administrators: true,
            usageCounters: true,
            enhancedSubscriptions: true,
          },
        },
      },
    });
  }

  /**
   * Validation helpers
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    return domainRegex.test(domain);
  }
}

// Export singleton instance
export const schoolService = new SchoolService();