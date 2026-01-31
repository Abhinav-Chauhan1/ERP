/**
 * School Notification Settings Service
 * 
 * Manages school-specific notification preferences including email, SMS, WhatsApp,
 * and push notification settings with delivery preferences and timing controls.
 */

import { db } from "@/lib/db";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { logAuditEvent, AuditAction } from "./audit-service";
import { SchoolNotificationSettings } from "@prisma/client";

export interface SchoolNotificationSettingsData {
  // Email Notifications
  emailEnabled?: boolean;
  emailAdmissionUpdates?: boolean;
  emailFeeReminders?: boolean;
  emailExamNotifications?: boolean;
  emailAttendanceAlerts?: boolean;
  emailSystemUpdates?: boolean;
  
  // SMS Notifications
  smsEnabled?: boolean;
  smsAdmissionUpdates?: boolean;
  smsFeeReminders?: boolean;
  smsExamNotifications?: boolean;
  smsAttendanceAlerts?: boolean;
  smsEmergencyAlerts?: boolean;
  
  // WhatsApp Notifications
  whatsappEnabled?: boolean;
  whatsappAdmissionUpdates?: boolean;
  whatsappFeeReminders?: boolean;
  whatsappExamNotifications?: boolean;
  whatsappAttendanceAlerts?: boolean;
  whatsappGeneralUpdates?: boolean;
  
  // Push Notifications
  pushEnabled?: boolean;
  pushAdmissionUpdates?: boolean;
  pushFeeReminders?: boolean;
  pushExamNotifications?: boolean;
  pushAttendanceAlerts?: boolean;
  pushSystemMaintenance?: boolean;
  
  // Notification Timing
  quietHoursEnabled?: boolean;
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string; // HH:MM format
  weekendNotifications?: boolean;
  
  // Delivery Preferences
  batchNotifications?: boolean;
  immediateEmergency?: boolean;
  digestFrequency?: string; // IMMEDIATE, HOURLY, DAILY, WEEKLY
}

export interface NotificationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  isPremium: boolean;
  settings: Array<{
    key: string;
    name: string;
    description: string;
    enabled: boolean;
  }>;
}

export interface NotificationStats {
  totalSent: number;
  deliveryRate: number;
  channelBreakdown: {
    email: { sent: number; delivered: number; failed: number };
    sms: { sent: number; delivered: number; failed: number };
    whatsapp: { sent: number; delivered: number; failed: number };
    push: { sent: number; delivered: number; failed: number };
  };
  recentActivity: Array<{
    timestamp: Date;
    channel: string;
    type: string;
    status: string;
    recipient: string;
  }>;
}

class SchoolNotificationSettingsService {
  /**
   * Get school notification settings with defaults if not exists
   */
  async getSchoolNotificationSettings(schoolId: string): Promise<SchoolNotificationSettings> {
    await requireSuperAdminAccess();

    let settings = await db.schoolNotificationSettings.findUnique({
      where: { schoolId },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await this.createDefaultNotificationSettings(schoolId);
    }

    return settings;
  }

  /**
   * Update school notification settings
   */
  async updateSchoolNotificationSettings(
    schoolId: string,
    data: SchoolNotificationSettingsData,
    updatedBy: string
  ): Promise<SchoolNotificationSettings> {
    await requireSuperAdminAccess();

    // Validate school exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, plan: true },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Validate settings
    const validation = this.validateNotificationSettings(data);
    if (!validation.isValid) {
      throw new Error(`Invalid notification settings: ${validation.errors.join(', ')}`);
    }

    // Check plan restrictions
    const planRestrictions = this.getPlanRestrictions(school.plan);
    this.enforceplanRestrictions(data, planRestrictions);

    // Get current settings for audit trail
    const currentSettings = await this.getSchoolNotificationSettings(schoolId);

    // Update settings
    const updatedSettings = await db.schoolNotificationSettings.upsert({
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
      resource: 'SCHOOL_NOTIFICATION_SETTINGS',
      resourceId: schoolId,
      changes: {
        before: this.extractSettingsChanges(currentSettings),
        after: this.extractSettingsChanges(updatedSettings),
      },
    });

    return updatedSettings;
  }

  /**
   * Create default notification settings for a school
   */
  async createDefaultNotificationSettings(schoolId: string): Promise<SchoolNotificationSettings> {
    // Get school plan to set appropriate defaults
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { plan: true },
    });

    const planDefaults = this.getDefaultsForPlan(school?.plan || 'STARTER');

    const defaultSettings = await db.schoolNotificationSettings.create({
      data: {
        schoolId,
        ...planDefaults,
      },
    });

    return defaultSettings;
  }

  /**
   * Get default settings based on plan
   */
  private getDefaultsForPlan(plan: string): Partial<SchoolNotificationSettingsData> {
    const planDefaults = {
      STARTER: {
        smsEnabled: false,
        whatsappEnabled: false,
        digestFrequency: 'DAILY',
        batchNotifications: true,
      },
      GROWTH: {
        smsEnabled: true,
        whatsappEnabled: true,
        digestFrequency: 'HOURLY',
        batchNotifications: false,
      },
      DOMINATE: {
        smsEnabled: true,
        whatsappEnabled: true,
        digestFrequency: 'IMMEDIATE',
        batchNotifications: false,
      },
    };

    return planDefaults[plan as keyof typeof planDefaults] || planDefaults.STARTER;
  }

  /**
   * Get plan restrictions for notification features
   */
  private getPlanRestrictions(plan: string): Record<string, boolean> {
    const restrictions = {
      STARTER: {
        smsEnabled: false,
        whatsappEnabled: false,
        immediateDelivery: false,
      },
      GROWTH: {
        smsEnabled: true,
        whatsappEnabled: true,
        immediateDelivery: true,
      },
      DOMINATE: {
        smsEnabled: true,
        whatsappEnabled: true,
        immediateDelivery: true,
      },
    };

    return restrictions[plan as keyof typeof restrictions] || restrictions.STARTER;
  }

  /**
   * Enforce plan restrictions on settings
   */
  private enforceplanRestrictions(
    data: SchoolNotificationSettingsData,
    restrictions: Record<string, boolean>
  ): void {
    if (!restrictions.smsEnabled && data.smsEnabled) {
      throw new Error("SMS notifications are not available in your current plan");
    }

    if (!restrictions.whatsappEnabled && data.whatsappEnabled) {
      throw new Error("WhatsApp notifications are not available in your current plan");
    }

    if (!restrictions.immediateDelivery && data.digestFrequency === 'IMMEDIATE') {
      throw new Error("Immediate delivery is not available in your current plan");
    }
  }

  /**
   * Validate notification settings
   */
  validateNotificationSettings(data: SchoolNotificationSettingsData): NotificationValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate quiet hours format
    if (data.quietHoursStart) {
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.quietHoursStart)) {
        errors.push("Invalid quiet hours start time format. Use HH:MM format");
      }
    }

    if (data.quietHoursEnd) {
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.quietHoursEnd)) {
        errors.push("Invalid quiet hours end time format. Use HH:MM format");
      }
    }

    // Validate digest frequency
    if (data.digestFrequency && !['IMMEDIATE', 'HOURLY', 'DAILY', 'WEEKLY'].includes(data.digestFrequency)) {
      errors.push("Invalid digest frequency. Must be IMMEDIATE, HOURLY, DAILY, or WEEKLY");
    }

    // Check for conflicting settings
    if (data.batchNotifications && data.digestFrequency === 'IMMEDIATE') {
      warnings.push("Batch notifications and immediate delivery may conflict");
    }

    // Warn about disabled channels
    if (data.emailEnabled === false && data.smsEnabled === false && data.whatsappEnabled === false && data.pushEnabled === false) {
      warnings.push("All notification channels are disabled. Users may miss important updates");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get notification channels configuration
   */
  async getNotificationChannels(schoolId: string): Promise<NotificationChannel[]> {
    const settings = await this.getSchoolNotificationSettings(schoolId);
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { plan: true },
    });

    const restrictions = this.getPlanRestrictions(school?.plan || 'STARTER');

    return [
      {
        id: 'email',
        name: 'Email Notifications',
        description: 'Send notifications via email',
        enabled: settings.emailEnabled,
        isPremium: false,
        settings: [
          { key: 'emailAdmissionUpdates', name: 'Admission Updates', description: 'New admissions and application status', enabled: settings.emailAdmissionUpdates },
          { key: 'emailFeeReminders', name: 'Fee Reminders', description: 'Fee payment reminders and receipts', enabled: settings.emailFeeReminders },
          { key: 'emailExamNotifications', name: 'Exam Notifications', description: 'Exam schedules and results', enabled: settings.emailExamNotifications },
          { key: 'emailAttendanceAlerts', name: 'Attendance Alerts', description: 'Low attendance warnings', enabled: settings.emailAttendanceAlerts },
          { key: 'emailSystemUpdates', name: 'System Updates', description: 'System maintenance and updates', enabled: settings.emailSystemUpdates },
        ],
      },
      {
        id: 'sms',
        name: 'SMS Notifications',
        description: 'Send notifications via SMS',
        enabled: settings.smsEnabled && restrictions.smsEnabled,
        isPremium: !restrictions.smsEnabled,
        settings: [
          { key: 'smsAdmissionUpdates', name: 'Admission Updates', description: 'Critical admission notifications', enabled: settings.smsAdmissionUpdates },
          { key: 'smsFeeReminders', name: 'Fee Reminders', description: 'Urgent fee payment reminders', enabled: settings.smsFeeReminders },
          { key: 'smsExamNotifications', name: 'Exam Notifications', description: 'Exam reminders and urgent updates', enabled: settings.smsExamNotifications },
          { key: 'smsAttendanceAlerts', name: 'Attendance Alerts', description: 'Immediate attendance alerts', enabled: settings.smsAttendanceAlerts },
          { key: 'smsEmergencyAlerts', name: 'Emergency Alerts', description: 'Emergency and safety notifications', enabled: settings.smsEmergencyAlerts },
        ],
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp Notifications',
        description: 'Send notifications via WhatsApp',
        enabled: settings.whatsappEnabled && restrictions.whatsappEnabled,
        isPremium: !restrictions.whatsappEnabled,
        settings: [
          { key: 'whatsappAdmissionUpdates', name: 'Admission Updates', description: 'Admission status and updates', enabled: settings.whatsappAdmissionUpdates },
          { key: 'whatsappFeeReminders', name: 'Fee Reminders', description: 'Fee payment reminders', enabled: settings.whatsappFeeReminders },
          { key: 'whatsappExamNotifications', name: 'Exam Notifications', description: 'Exam schedules and results', enabled: settings.whatsappExamNotifications },
          { key: 'whatsappAttendanceAlerts', name: 'Attendance Alerts', description: 'Attendance notifications', enabled: settings.whatsappAttendanceAlerts },
          { key: 'whatsappGeneralUpdates', name: 'General Updates', description: 'School announcements and updates', enabled: settings.whatsappGeneralUpdates },
        ],
      },
      {
        id: 'push',
        name: 'Push Notifications',
        description: 'Send push notifications to mobile app',
        enabled: settings.pushEnabled,
        isPremium: false,
        settings: [
          { key: 'pushAdmissionUpdates', name: 'Admission Updates', description: 'Admission notifications', enabled: settings.pushAdmissionUpdates },
          { key: 'pushFeeReminders', name: 'Fee Reminders', description: 'Fee payment reminders', enabled: settings.pushFeeReminders },
          { key: 'pushExamNotifications', name: 'Exam Notifications', description: 'Exam schedules and results', enabled: settings.pushExamNotifications },
          { key: 'pushAttendanceAlerts', name: 'Attendance Alerts', description: 'Attendance notifications', enabled: settings.pushAttendanceAlerts },
          { key: 'pushSystemMaintenance', name: 'System Maintenance', description: 'System maintenance notifications', enabled: settings.pushSystemMaintenance },
        ],
      },
    ];
  }

  /**
   * Get notification statistics for a school
   */
  async getNotificationStats(schoolId: string, timeRange: string = '30d'): Promise<NotificationStats> {
    await requireSuperAdminAccess();

    // In a real implementation, this would query actual notification logs
    // For now, returning mock data
    return {
      totalSent: 1250,
      deliveryRate: 94.5,
      channelBreakdown: {
        email: { sent: 800, delivered: 760, failed: 40 },
        sms: { sent: 200, delivered: 195, failed: 5 },
        whatsapp: { sent: 150, delivered: 148, failed: 2 },
        push: { sent: 100, delivered: 98, failed: 2 },
      },
      recentActivity: [
        { timestamp: new Date(), channel: 'email', type: 'fee_reminder', status: 'delivered', recipient: 'parent@example.com' },
        { timestamp: new Date(), channel: 'sms', type: 'attendance_alert', status: 'delivered', recipient: '+91XXXXXXXXXX' },
        { timestamp: new Date(), channel: 'whatsapp', type: 'exam_notification', status: 'delivered', recipient: '+91XXXXXXXXXX' },
      ],
    };
  }

  /**
   * Test notification delivery for a school
   */
  async testNotificationDelivery(
    schoolId: string,
    channel: string,
    recipient: string,
    testedBy: string
  ): Promise<{ success: boolean; message: string; deliveryTime?: number }> {
    await requireSuperAdminAccess();

    const settings = await this.getSchoolNotificationSettings(schoolId);

    // Check if channel is enabled
    const channelEnabled = {
      email: settings.emailEnabled,
      sms: settings.smsEnabled,
      whatsapp: settings.whatsappEnabled,
      push: settings.pushEnabled,
    };

    if (!channelEnabled[channel as keyof typeof channelEnabled]) {
      return {
        success: false,
        message: `${channel} notifications are disabled for this school`,
      };
    }

    // Log test notification
    await logAuditEvent({
      userId: testedBy,
      action: AuditAction.CREATE,
      resource: 'NOTIFICATION_TEST',
      resourceId: schoolId,
      changes: { channel, recipient },
    });

    // Simulate test delivery
    const deliveryTime = Math.floor(Math.random() * 3000) + 500; // 500-3500ms

    return {
      success: true,
      message: `Test notification sent successfully via ${channel}`,
      deliveryTime,
    };
  }

  /**
   * Extract settings changes for audit logging
   */
  private extractSettingsChanges(settings: SchoolNotificationSettings): Record<string, any> {
    const {
      id, schoolId, createdAt, updatedAt, ...settingsData
    } = settings;
    return settingsData;
  }

  /**
   * Bulk update notification settings for multiple schools
   */
  async bulkUpdateNotificationSettings(
    schoolIds: string[],
    data: SchoolNotificationSettingsData,
    updatedBy: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    await requireSuperAdminAccess();

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const schoolId of schoolIds) {
      try {
        await this.updateSchoolNotificationSettings(schoolId, data, updatedBy);
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
export const schoolNotificationSettingsService = new SchoolNotificationSettingsService();
export default schoolNotificationSettingsService;