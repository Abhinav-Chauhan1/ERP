/**
 * School Permissions Service
 * 
 * Manages school-specific permissions and feature access controls.
 * Provides CRUD operations for school permissions with audit logging.
 */

import { db } from "@/lib/db";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { logAuditEvent, AuditAction } from "./audit-service";
import { SchoolPermissions, Prisma } from "@prisma/client";

export interface SchoolPermissionsData {
  // User Management Permissions
  manageStudents?: boolean;
  manageTeachers?: boolean;
  manageParents?: boolean;
  manageAdmins?: boolean;
  
  // Academic Permissions
  manageClasses?: boolean;
  manageSubjects?: boolean;
  manageSyllabus?: boolean;
  manageExams?: boolean;
  manageAssignments?: boolean;
  manageAttendance?: boolean;
  generateReportCards?: boolean;
  
  // Communication Permissions
  messagingSystem?: boolean;
  notificationSystem?: boolean;
  announcementSystem?: boolean;
  whatsappIntegration?: boolean;
  smsIntegration?: boolean;
  emailIntegration?: boolean;
  
  // Financial Permissions
  feeManagement?: boolean;
  paymentProcessing?: boolean;
  financialReports?: boolean;
  
  // Advanced Features
  libraryManagement?: boolean;
  transportManagement?: boolean;
  hostelManagement?: boolean;
  alumniManagement?: boolean;
  certificateGeneration?: boolean;
  
  // System Permissions
  backupRestore?: boolean;
  dataExport?: boolean;
  auditLogs?: boolean;
  apiAccess?: boolean;
  customBranding?: boolean;
}

export interface PermissionCategory {
  id: string;
  name: string;
  description: string;
  permissions: Array<{
    key: keyof SchoolPermissionsData;
    name: string;
    description: string;
    isPremium?: boolean;
  }>;
}

class SchoolPermissionsService {
  /**
   * Get school permissions with defaults if not exists
   */
  async getSchoolPermissions(schoolId: string): Promise<SchoolPermissions> {
    await requireSuperAdminAccess();

    let permissions = await db.schoolPermissions.findUnique({
      where: { schoolId },
    });

    // Create default permissions if not exists
    if (!permissions) {
      permissions = await this.createDefaultPermissions(schoolId);
    }

    return permissions;
  }

  /**
   * Update school permissions
   */
  async updateSchoolPermissions(
    schoolId: string,
    data: SchoolPermissionsData,
    updatedBy: string
  ): Promise<SchoolPermissions> {
    await requireSuperAdminAccess();

    // Validate school exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, plan: true },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Get current permissions for audit trail
    const currentPermissions = await this.getSchoolPermissions(schoolId);

    // Update permissions
    const updatedPermissions = await db.schoolPermissions.upsert({
      where: { schoolId },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        schoolId,
        ...data,
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: updatedBy,
      action: AuditAction.UPDATE,
      resource: 'SCHOOL_PERMISSIONS',
      resourceId: schoolId,
      changes: {
        before: this.extractPermissionChanges(currentPermissions),
        after: this.extractPermissionChanges(updatedPermissions),
      },
    });

    return updatedPermissions;
  }

  /**
   * Create default permissions for a school
   */
  async createDefaultPermissions(schoolId: string): Promise<SchoolPermissions> {
    const defaultPermissions = await db.schoolPermissions.create({
      data: {
        schoolId,
        // Default permissions based on plan would be set here
        // For now, using schema defaults
      },
    });

    return defaultPermissions;
  }

  /**
   * Get permission categories for UI display
   */
  getPermissionCategories(): PermissionCategory[] {
    return [
      {
        id: 'user_management',
        name: 'User Management',
        description: 'Manage users and their access',
        permissions: [
          { key: 'manageStudents', name: 'Manage Students', description: 'Add, edit, and remove student accounts' },
          { key: 'manageTeachers', name: 'Manage Teachers', description: 'Add, edit, and remove teacher accounts' },
          { key: 'manageParents', name: 'Manage Parents', description: 'Add, edit, and remove parent accounts' },
          { key: 'manageAdmins', name: 'Manage Administrators', description: 'Add, edit, and remove admin accounts' },
        ],
      },
      {
        id: 'academic',
        name: 'Academic Features',
        description: 'Academic and curriculum management',
        permissions: [
          { key: 'manageClasses', name: 'Class Management', description: 'Create and manage classes and sections' },
          { key: 'manageSubjects', name: 'Subject Management', description: 'Add and manage subjects and curriculum' },
          { key: 'manageSyllabus', name: 'Syllabus Management', description: 'Create and manage syllabus content' },
          { key: 'manageExams', name: 'Exam Management', description: 'Create and manage examinations' },
          { key: 'manageAssignments', name: 'Assignment Management', description: 'Create and manage assignments' },
          { key: 'manageAttendance', name: 'Attendance Tracking', description: 'Track and manage attendance' },
          { key: 'generateReportCards', name: 'Report Card Generation', description: 'Generate and manage report cards' },
        ],
      },
      {
        id: 'communication',
        name: 'Communication',
        description: 'Communication and messaging features',
        permissions: [
          { key: 'messagingSystem', name: 'Messaging System', description: 'Internal messaging between users' },
          { key: 'notificationSystem', name: 'Notification System', description: 'Send notifications to users' },
          { key: 'announcementSystem', name: 'Announcement System', description: 'Create and manage announcements' },
          { key: 'whatsappIntegration', name: 'WhatsApp Integration', description: 'Send messages via WhatsApp', isPremium: true },
          { key: 'smsIntegration', name: 'SMS Integration', description: 'Send SMS messages', isPremium: true },
          { key: 'emailIntegration', name: 'Email Integration', description: 'Send email notifications' },
        ],
      },
      {
        id: 'financial',
        name: 'Financial Management',
        description: 'Fee and payment management',
        permissions: [
          { key: 'feeManagement', name: 'Fee Management', description: 'Manage fee structures and collections' },
          { key: 'paymentProcessing', name: 'Payment Processing', description: 'Process online payments' },
          { key: 'financialReports', name: 'Financial Reports', description: 'Generate financial reports and analytics' },
        ],
      },
      {
        id: 'advanced',
        name: 'Advanced Features',
        description: 'Advanced school management features',
        permissions: [
          { key: 'libraryManagement', name: 'Library Management', description: 'Manage library books and resources', isPremium: true },
          { key: 'transportManagement', name: 'Transport Management', description: 'Manage school transportation', isPremium: true },
          { key: 'hostelManagement', name: 'Hostel Management', description: 'Manage hostel facilities', isPremium: true },
          { key: 'alumniManagement', name: 'Alumni Management', description: 'Manage alumni database', isPremium: true },
          { key: 'certificateGeneration', name: 'Certificate Generation', description: 'Generate certificates and documents', isPremium: true },
        ],
      },
      {
        id: 'system',
        name: 'System Features',
        description: 'System administration and data management',
        permissions: [
          { key: 'backupRestore', name: 'Backup & Restore', description: 'Create and restore data backups' },
          { key: 'dataExport', name: 'Data Export', description: 'Export data in various formats' },
          { key: 'auditLogs', name: 'Audit Logs', description: 'View system audit logs' },
          { key: 'apiAccess', name: 'API Access', description: 'Access to REST API endpoints', isPremium: true },
          { key: 'customBranding', name: 'Custom Branding', description: 'Customize school branding and themes' },
        ],
      },
    ];
  }

  /**
   * Check if a school has a specific permission
   */
  async hasPermission(schoolId: string, permission: keyof SchoolPermissionsData): Promise<boolean> {
    const permissions = await this.getSchoolPermissions(schoolId);
    return permissions[permission] ?? false;
  }

  /**
   * Get permissions based on plan restrictions
   */
  async getPermissionsForPlan(plan: string): Promise<Partial<SchoolPermissionsData>> {
    const planPermissions = {
      STARTER: {
        // Basic permissions for starter plan
        whatsappIntegration: false,
        smsIntegration: false,
        libraryManagement: false,
        transportManagement: false,
        hostelManagement: false,
        alumniManagement: false,
        certificateGeneration: false,
        apiAccess: false,
      },
      GROWTH: {
        // Enhanced permissions for growth plan
        whatsappIntegration: true,
        smsIntegration: true,
        libraryManagement: true,
        transportManagement: false,
        hostelManagement: false,
        alumniManagement: true,
        certificateGeneration: true,
        apiAccess: false,
      },
      DOMINATE: {
        // All permissions for dominate plan
        whatsappIntegration: true,
        smsIntegration: true,
        libraryManagement: true,
        transportManagement: true,
        hostelManagement: true,
        alumniManagement: true,
        certificateGeneration: true,
        apiAccess: true,
      },
    };

    return planPermissions[plan as keyof typeof planPermissions] || {};
  }

  /**
   * Extract permission changes for audit logging
   */
  private extractPermissionChanges(permissions: SchoolPermissions): Record<string, boolean> {
    const {
      id, schoolId, createdAt, updatedAt, ...permissionData
    } = permissions;
    return permissionData;
  }

  /**
   * Bulk update permissions for multiple schools
   */
  async bulkUpdatePermissions(
    schoolIds: string[],
    data: SchoolPermissionsData,
    updatedBy: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    await requireSuperAdminAccess();

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const schoolId of schoolIds) {
      try {
        await this.updateSchoolPermissions(schoolId, data, updatedBy);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`School ${schoolId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }
}

// Export singleton instance
export const schoolPermissionsService = new SchoolPermissionsService();
export default schoolPermissionsService;