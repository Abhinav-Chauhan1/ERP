/**
 * School Security Settings Service
 * 
 * Manages school-specific security configurations including 2FA, session management,
 * password policies, IP whitelisting, and audit logging settings.
 */

import { db } from "@/lib/db";
import { requireSuperAdminAccess } from "@/lib/auth/tenant";
import { logAuditEvent, AuditAction } from "./audit-service";
import { SchoolSettings } from "@prisma/client";

export interface SchoolSecuritySettingsData {
  // Two-Factor Authentication
  twoFactorEnabled?: boolean;
  twoFactorRequired?: boolean;
  twoFactorMethods?: string[];
  
  // Session Management
  sessionTimeout?: number; // minutes
  maxConcurrentSessions?: number;
  forceLogoutOnPasswordChange?: boolean;
  
  // Password Policy
  passwordMinLength?: number;
  passwordRequireUppercase?: boolean;
  passwordRequireLowercase?: boolean;
  passwordRequireNumbers?: boolean;
  passwordRequireSpecialChars?: boolean;
  passwordExpiry?: number; // days, 0 = never
  
  // IP Whitelisting
  ipWhitelistEnabled?: boolean;
  allowedIPs?: string[];
  blockUnknownIPs?: boolean;
  
  // Audit Logging
  auditLoggingEnabled?: boolean;
  auditLogLevel?: string;
  auditLogRetention?: number; // days
  
  // Data Encryption
  encryptSensitiveData?: boolean;
  encryptionLevel?: string;
  
  // API Security
  rateLimitEnabled?: boolean;
  maxRequestsPerMinute?: number;
  requireApiKey?: boolean;
}

export interface SecuritySettingsValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class SchoolSecuritySettingsService {
  /**
   * Get school security settings with defaults if not exists
   */
  async getSchoolSecuritySettings(schoolId: string): Promise<SchoolSettings> {
    await requireSuperAdminAccess();

    let settings = await db.schoolSettings.findUnique({
      where: { schoolId },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await this.createDefaultSecuritySettings(schoolId);
    }

    return settings;
  }

  /**
   * Update school security settings
   */
  async updateSchoolSecuritySettings(
    schoolId: string,
    data: SchoolSecuritySettingsData,
    updatedBy: string
  ): Promise<SchoolSettings> {
    await requireSuperAdminAccess();

    // Validate school exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Validate settings
    const validation = this.validateSecuritySettings(data);
    if (!validation.isValid) {
      throw new Error(`Invalid security settings: ${validation.errors.join(', ')}`);
    }

    // Get current settings for audit trail
    const currentSettings = await this.getSchoolSecuritySettings(schoolId);

    // Update settings
    const updatedSettings = await db.schoolSettings.upsert({
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
      resource: 'SCHOOL_SECURITY_SETTINGS',
      resourceId: schoolId,
      changes: {
        before: this.extractSettingsChanges(currentSettings),
        after: this.extractSettingsChanges(updatedSettings),
      },
    });

    return updatedSettings;
  }

  /**
   * Create default security settings for a school
   */
  async createDefaultSecuritySettings(schoolId: string): Promise<SchoolSettings> {
    const defaultSettings = await db.schoolSettings.create({
      data: {
        schoolId,
        // Using schema defaults
      },
    });

    return defaultSettings;
  }

  /**
   * Validate security settings
   */
  validateSecuritySettings(data: SchoolSecuritySettingsData): SecuritySettingsValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate session timeout
    if (data.sessionTimeout !== undefined) {
      if (data.sessionTimeout < 15 || data.sessionTimeout > 1440) {
        errors.push("Session timeout must be between 15 and 1440 minutes");
      }
      if (data.sessionTimeout < 60) {
        warnings.push("Session timeout less than 60 minutes may impact user experience");
      }
    }

    // Validate concurrent sessions
    if (data.maxConcurrentSessions !== undefined) {
      if (data.maxConcurrentSessions < 1 || data.maxConcurrentSessions > 10) {
        errors.push("Max concurrent sessions must be between 1 and 10");
      }
    }

    // Validate password policy
    if (data.passwordMinLength !== undefined) {
      if (data.passwordMinLength < 6 || data.passwordMinLength > 32) {
        errors.push("Password minimum length must be between 6 and 32 characters");
      }
      if (data.passwordMinLength < 8) {
        warnings.push("Password minimum length less than 8 characters is not recommended");
      }
    }

    if (data.passwordExpiry !== undefined) {
      if (data.passwordExpiry < 0 || data.passwordExpiry > 365) {
        errors.push("Password expiry must be between 0 and 365 days");
      }
    }

    // Validate IP addresses
    if (data.allowedIPs && data.allowedIPs.length > 0) {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const invalidIPs = data.allowedIPs.filter(ip => !ipRegex.test(ip));
      if (invalidIPs.length > 0) {
        errors.push(`Invalid IP addresses: ${invalidIPs.join(', ')}`);
      }
    }

    // Validate audit log retention
    if (data.auditLogRetention !== undefined) {
      if (data.auditLogRetention < 30 || data.auditLogRetention > 2555) {
        errors.push("Audit log retention must be between 30 and 2555 days");
      }
    }

    // Validate rate limiting
    if (data.maxRequestsPerMinute !== undefined) {
      if (data.maxRequestsPerMinute < 10 || data.maxRequestsPerMinute > 1000) {
        errors.push("Max requests per minute must be between 10 and 1000");
      }
    }

    // Validate encryption level
    if (data.encryptionLevel && !['AES-128', 'AES-256', 'RSA-2048'].includes(data.encryptionLevel)) {
      errors.push("Invalid encryption level. Must be AES-128, AES-256, or RSA-2048");
    }

    // Validate audit log level
    if (data.auditLogLevel && !['ERROR', 'WARN', 'INFO', 'DEBUG'].includes(data.auditLogLevel)) {
      errors.push("Invalid audit log level. Must be ERROR, WARN, INFO, or DEBUG");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get security recommendations based on current settings
   */
  async getSecurityRecommendations(schoolId: string): Promise<string[]> {
    const settings = await this.getSchoolSecuritySettings(schoolId);
    const recommendations: string[] = [];

    if (!settings.twoFactorEnabled) {
      recommendations.push("Enable two-factor authentication for enhanced security");
    }

    if (settings.passwordMinLength < 8) {
      recommendations.push("Increase minimum password length to at least 8 characters");
    }

    if (!settings.passwordRequireUppercase || !settings.passwordRequireLowercase || !settings.passwordRequireNumbers) {
      recommendations.push("Enforce stronger password complexity requirements");
    }

    if (settings.sessionTimeout > 480) {
      recommendations.push("Consider reducing session timeout for better security");
    }

    if (!settings.auditLoggingEnabled) {
      recommendations.push("Enable audit logging to track security events");
    }

    if (!settings.rateLimitEnabled) {
      recommendations.push("Enable rate limiting to prevent abuse");
    }

    if (settings.passwordExpiry === 0) {
      recommendations.push("Consider setting password expiry to enforce regular password changes");
    }

    return recommendations;
  }

  /**
   * Get security score based on current settings
   */
  async getSecurityScore(schoolId: string): Promise<{ score: number; maxScore: number; breakdown: Record<string, number> }> {
    const settings = await this.getSchoolSecuritySettings(schoolId);
    const breakdown: Record<string, number> = {};
    let score = 0;
    const maxScore = 100;

    // Two-factor authentication (20 points)
    if (settings.twoFactorEnabled) {
      breakdown.twoFactor = 15;
      score += 15;
      if (settings.twoFactorRequired) {
        breakdown.twoFactor += 5;
        score += 5;
      }
    } else {
      breakdown.twoFactor = 0;
    }

    // Password policy (25 points)
    let passwordScore = 0;
    if (settings.passwordMinLength >= 8) passwordScore += 5;
    if (settings.passwordRequireUppercase) passwordScore += 5;
    if (settings.passwordRequireLowercase) passwordScore += 5;
    if (settings.passwordRequireNumbers) passwordScore += 5;
    if (settings.passwordRequireSpecialChars) passwordScore += 3;
    if (settings.passwordExpiry > 0 && settings.passwordExpiry <= 90) passwordScore += 2;
    breakdown.passwordPolicy = passwordScore;
    score += passwordScore;

    // Session management (15 points)
    let sessionScore = 0;
    if (settings.sessionTimeout <= 480) sessionScore += 5;
    if (settings.maxConcurrentSessions <= 3) sessionScore += 5;
    if (settings.forceLogoutOnPasswordChange) sessionScore += 5;
    breakdown.sessionManagement = sessionScore;
    score += sessionScore;

    // IP whitelisting (10 points)
    if (settings.ipWhitelistEnabled && settings.allowedIPs.length > 0) {
      breakdown.ipWhitelisting = 10;
      score += 10;
    } else {
      breakdown.ipWhitelisting = 0;
    }

    // Audit logging (15 points)
    if (settings.auditLoggingEnabled) {
      breakdown.auditLogging = 10;
      score += 10;
      if (settings.auditLogRetention >= 365) {
        breakdown.auditLogging += 5;
        score += 5;
      }
    } else {
      breakdown.auditLogging = 0;
    }

    // Data encryption (10 points)
    if (settings.encryptSensitiveData) {
      breakdown.dataEncryption = 7;
      score += 7;
      if (settings.encryptionLevel === 'AES-256') {
        breakdown.dataEncryption += 3;
        score += 3;
      }
    } else {
      breakdown.dataEncryption = 0;
    }

    // API security (5 points)
    if (settings.rateLimitEnabled) {
      breakdown.apiSecurity = 3;
      score += 3;
      if (settings.requireApiKey) {
        breakdown.apiSecurity += 2;
        score += 2;
      }
    } else {
      breakdown.apiSecurity = 0;
    }

    return { score, maxScore, breakdown };
  }

  /**
   * Extract settings changes for audit logging
   */
  private extractSettingsChanges(settings: SchoolSettings): Record<string, any> {
    const {
      id, schoolId, createdAt, updatedAt, ...settingsData
    } = settings;
    return settingsData;
  }

  /**
   * Bulk update security settings for multiple schools
   */
  async bulkUpdateSecuritySettings(
    schoolIds: string[],
    data: SchoolSecuritySettingsData,
    updatedBy: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    await requireSuperAdminAccess();

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const schoolId of schoolIds) {
      try {
        await this.updateSchoolSecuritySettings(schoolId, data, updatedBy);
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
export const schoolSecuritySettingsService = new SchoolSecuritySettingsService();
export default schoolSecuritySettingsService;