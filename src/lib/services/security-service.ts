import { db } from "@/lib/db";
import { auditService, AuditAction } from "./audit-service";
import crypto from "crypto";
import speakeasy from "speakeasy";

/**
 * Security Service
 * Implements user activity logging, session management, security event detection,
 * automated responses, and multi-factor authentication for sensitive operations.
 * 
 * Requirements: 6.4, 6.5, 6.6
 */

// Types for security management
export interface UserActivity {
  id: string;
  userId: string;
  sessionId?: string;
  action: string;
  resource?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  deviceFingerprint?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  description: string;
  details: Record<string, any>;
  status: 'DETECTED' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  detectedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  automatedResponse?: string;
}

export type SecurityEventType = 
  | 'SUSPICIOUS_LOGIN'
  | 'MULTIPLE_FAILED_LOGINS'
  | 'UNUSUAL_LOCATION'
  | 'PRIVILEGE_ESCALATION'
  | 'DATA_BREACH_ATTEMPT'
  | 'UNAUTHORIZED_ACCESS'
  | 'SESSION_HIJACKING'
  | 'BRUTE_FORCE_ATTACK'
  | 'ACCOUNT_TAKEOVER'
  | 'MALICIOUS_ACTIVITY';

export interface SessionInfo {
  id: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  deviceFingerprint?: string;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface MfaSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface MfaVerification {
  isValid: boolean;
  remainingAttempts?: number;
  lockoutUntil?: Date;
}

class SecurityService {
  /**
   * Log user activity
   * Requirements: 6.4 - User activity logging and session management
   */
  async logUserActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>): Promise<UserActivity> {
    try {
      // Create activity record using audit service
      await auditService.logAuditEvent({
        userId: activity.userId,
        action: activity.action as AuditAction,
        resource: activity.resource || 'user_activity',
        resourceId: activity.sessionId,
        details: {
          sessionId: activity.sessionId,
          ipAddress: activity.ipAddress,
          userAgent: activity.userAgent,
          location: activity.location,
          deviceFingerprint: activity.deviceFingerprint,
          metadata: activity.metadata,
          activityType: 'USER_ACTIVITY'
        },
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent
      });

      const activityRecord: UserActivity = {
        id: crypto.randomUUID(),
        ...activity,
        timestamp: new Date()
      };

      // Check for suspicious patterns
      await this.detectSuspiciousActivity(activityRecord);

      return activityRecord;
    } catch (error) {
      console.error('Error logging user activity:', error);
      throw new Error('Failed to log user activity');
    }
  }

  /**
   * Get user activity history
   * Requirements: 6.4 - User activity logging and session management
   */
  async getUserActivityHistory(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      actions?: string[];
    }
  ): Promise<UserActivity[]> {
    try {
      const whereClause: any = {
        userId,
        details: {
          path: ['activityType'],
          equals: 'USER_ACTIVITY'
        }
      };

      if (options?.startDate || options?.endDate) {
        whereClause.timestamp = {};
        if (options.startDate) whereClause.timestamp.gte = options.startDate;
        if (options.endDate) whereClause.timestamp.lte = options.endDate;
      }

      if (options?.actions && options.actions.length > 0) {
        whereClause.action = { in: options.actions };
      }

      const activities = await db.auditLog.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: options?.limit || 100,
        skip: options?.offset || 0
      });

      return activities.map(log => ({
        id: log.id,
        userId: log.userId || '',
        sessionId: (log.details as any)?.sessionId,
        action: log.action,
        resource: log.resource || undefined,
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        location: (log.details as any)?.location,
        deviceFingerprint: (log.details as any)?.deviceFingerprint,
        timestamp: log.timestamp || new Date(),
        metadata: (log.details as any)?.metadata
      }));
    } catch (error) {
      console.error('Error getting user activity history:', error);
      throw new Error('Failed to get user activity history');
    }
  }

  /**
   * Manage user sessions
   * Requirements: 6.4 - User activity logging and session management
   */
  async createSession(data: {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    deviceFingerprint?: string;
    expiresAt?: Date;
  }): Promise<SessionInfo> {
    try {
      const sessionId = crypto.randomUUID();
      const expiresAt = data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create session record in database
      await db.session.create({
        data: {
          id: sessionId,
          userId: data.userId,
          expires: expiresAt,
          sessionToken: crypto.randomBytes(32).toString('hex')
        }
      });

      // Log session creation
      await this.logUserActivity({
        userId: data.userId,
        sessionId,
        action: 'SESSION_CREATE',
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
        deviceFingerprint: data.deviceFingerprint,
        metadata: { sessionCreated: true }
      });

      return {
        id: sessionId,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
        deviceFingerprint: data.deviceFingerprint,
        isActive: true,
        lastActivity: new Date(),
        createdAt: new Date(),
        expiresAt
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Update session activity
   * Requirements: 6.4 - User activity logging and session management
   */
  async updateSessionActivity(sessionId: string, activity?: Partial<UserActivity>): Promise<void> {
    try {
      // Update session last activity
      await db.session.update({
        where: { id: sessionId },
        data: { 
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // Extend by 24 hours
        }
      });

      if (activity?.userId) {
        await this.logUserActivity({
          userId: activity.userId,
          sessionId,
          action: 'SESSION_ACTIVITY',
          ipAddress: activity.ipAddress,
          userAgent: activity.userAgent,
          metadata: { sessionUpdated: true }
        });
      }
    } catch (error) {
      console.error('Error updating session activity:', error);
      // Don't throw error for session updates to avoid breaking user flow
    }
  }

  /**
   * Terminate session
   * Requirements: 6.4 - User activity logging and session management
   */
  async terminateSession(sessionId: string, reason?: string): Promise<void> {
    try {
      const session = await db.session.findUnique({
        where: { id: sessionId }
      });

      if (session) {
        await db.session.delete({
          where: { id: sessionId }
        });

        await this.logUserActivity({
          userId: session.userId,
          sessionId,
          action: 'SESSION_TERMINATE',
          metadata: { reason: reason || 'Manual termination' }
        });
      }
    } catch (error) {
      console.error('Error terminating session:', error);
      throw new Error('Failed to terminate session');
    }
  }

  /**
   * Detect suspicious activity patterns
   * Requirements: 6.5 - Security event detection and automated responses
   */
  async detectSuspiciousActivity(activity: UserActivity): Promise<SecurityEvent[]> {
    try {
      const events: SecurityEvent[] = [];

      // Check for multiple failed logins
      if (activity.action === 'LOGIN_FAILED') {
        const recentFailures = await this.getUserActivityHistory(activity.userId, {
          actions: ['LOGIN_FAILED'],
          startDate: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
          limit: 10
        });

        if (recentFailures.length >= 5) {
          const event = await this.createSecurityEvent({
            type: 'MULTIPLE_FAILED_LOGINS',
            severity: 'HIGH',
            userId: activity.userId,
            sessionId: activity.sessionId,
            ipAddress: activity.ipAddress,
            description: `Multiple failed login attempts detected (${recentFailures.length} attempts)`,
            details: {
              attemptCount: recentFailures.length,
              timeWindow: '15 minutes',
              ipAddresses: [...new Set(recentFailures.map(f => f.ipAddress).filter(Boolean))]
            }
          });
          events.push(event);

          // Automated response: Lock account temporarily
          await this.executeAutomatedResponse(event, 'LOCK_ACCOUNT_TEMPORARY');
        }
      }

      // Check for unusual location
      if (activity.location && activity.action === 'LOGIN_SUCCESS') {
        const recentLogins = await this.getUserActivityHistory(activity.userId, {
          actions: ['LOGIN_SUCCESS'],
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          limit: 50
        });

        const knownLocations = new Set(
          recentLogins.map(l => l.location).filter(Boolean)
        );

        if (!knownLocations.has(activity.location)) {
          const event = await this.createSecurityEvent({
            type: 'UNUSUAL_LOCATION',
            severity: 'MEDIUM',
            userId: activity.userId,
            sessionId: activity.sessionId,
            ipAddress: activity.ipAddress,
            description: `Login from unusual location: ${activity.location}`,
            details: {
              newLocation: activity.location,
              knownLocations: Array.from(knownLocations),
              ipAddress: activity.ipAddress
            }
          });
          events.push(event);

          // Automated response: Require MFA for sensitive operations
          await this.executeAutomatedResponse(event, 'REQUIRE_MFA');
        }
      }

      // Check for privilege escalation attempts
      if (activity.action === 'PERMISSION_DENIED' && activity.resource?.includes('ADMIN')) {
        const recentDenials = await this.getUserActivityHistory(activity.userId, {
          actions: ['PERMISSION_DENIED'],
          startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          limit: 10
        });

        const adminAttempts = recentDenials.filter(d => 
          d.resource?.includes('ADMIN') || d.resource?.includes('SUPER_ADMIN')
        );

        if (adminAttempts.length >= 3) {
          const event = await this.createSecurityEvent({
            type: 'PRIVILEGE_ESCALATION',
            severity: 'HIGH',
            userId: activity.userId,
            sessionId: activity.sessionId,
            ipAddress: activity.ipAddress,
            description: `Multiple privilege escalation attempts detected`,
            details: {
              attemptCount: adminAttempts.length,
              resources: adminAttempts.map(a => a.resource),
              timeWindow: '1 hour'
            }
          });
          events.push(event);

          // Automated response: Flag for review
          await this.executeAutomatedResponse(event, 'FLAG_FOR_REVIEW');
        }
      }

      return events;
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return [];
    }
  }

  /**
   * Create security event
   * Requirements: 6.5 - Security event detection and automated responses
   */
  async createSecurityEvent(data: Omit<SecurityEvent, 'id' | 'status' | 'detectedAt'>): Promise<SecurityEvent> {
    try {
      const eventId = crypto.randomUUID();
      
      const event: SecurityEvent = {
        id: eventId,
        ...data,
        status: 'DETECTED',
        detectedAt: new Date()
      };

      // Log security event
      await auditService.logAuditEvent({
        userId: data.userId || 'system',
        action: 'CREATE',
        resource: 'security_event',
        resourceId: eventId,
        details: {
          eventType: data.type,
          severity: data.severity,
          description: data.description,
          eventDetails: data.details,
          securityEventData: event
        },
        ipAddress: data.ipAddress
      });

      return event;
    } catch (error) {
      console.error('Error creating security event:', error);
      throw new Error('Failed to create security event');
    }
  }

  /**
   * Execute automated security response
   * Requirements: 6.5 - Security event detection and automated responses
   */
  async executeAutomatedResponse(event: SecurityEvent, responseType: string): Promise<void> {
    try {
      switch (responseType) {
        case 'LOCK_ACCOUNT_TEMPORARY':
          if (event.userId) {
            await db.user.update({
              where: { id: event.userId },
              data: { 
                active: false,
                // Store lockout info in permissions JSON field
                permissions: {
                  lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
                  lockReason: 'Multiple failed login attempts',
                  securityEventId: event.id
                }
              }
            });

            await auditService.logAuditEvent({
              userId: 'system',
              action: 'UPDATE',
              resource: 'user_security',
              resourceId: event.userId,
              details: {
                action: 'TEMPORARY_LOCK',
                reason: 'Automated response to security event',
                securityEventId: event.id,
                lockDuration: '30 minutes'
              }
            });
          }
          break;

        case 'REQUIRE_MFA':
          if (event.userId) {
            await db.user.update({
              where: { id: event.userId },
              data: {
                permissions: {
                  requireMfaUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                  mfaReason: 'Unusual activity detected',
                  securityEventId: event.id
                }
              }
            });
          }
          break;

        case 'FLAG_FOR_REVIEW':
          await auditService.logAuditEvent({
            userId: 'system',
            action: 'CREATE',
            resource: 'security_review',
            resourceId: event.id,
            details: {
              action: 'FLAG_FOR_MANUAL_REVIEW',
              priority: event.severity,
              reason: 'Automated security response',
              securityEventId: event.id
            }
          });
          break;

        default:
          console.warn(`Unknown automated response type: ${responseType}`);
      }

      // Update event with automated response
      await auditService.logAuditEvent({
        userId: 'system',
        action: 'UPDATE',
        resource: 'security_event',
        resourceId: event.id,
        details: {
          automatedResponse: responseType,
          responseExecutedAt: new Date(),
          originalEvent: event
        }
      });
    } catch (error) {
      console.error('Error executing automated response:', error);
      // Don't throw error to avoid breaking security detection flow
    }
  }

  /**
   * Setup multi-factor authentication
   * Requirements: 6.6 - Multi-factor authentication for sensitive operations
   */
  async setupMfa(userId: string): Promise<MfaSetup> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${user.firstName} ${user.lastName}`,
        issuer: 'SikshaERP',
        length: 32
      });

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );

      // Store MFA secret (encrypted)
      await db.user.update({
        where: { id: userId },
        data: {
          mfaSecret: secret.base32,
          twoFactorBackupCodes: backupCodes.join(',')
        }
      });

      // Log MFA setup
      await auditService.logAuditEvent({
        userId,
        action: 'CREATE',
        resource: 'mfa_setup',
        details: {
          mfaEnabled: true,
          backupCodesGenerated: backupCodes.length
        }
      });

      return {
        secret: secret.base32,
        qrCode: secret.otpauth_url || '',
        backupCodes
      };
    } catch (error) {
      console.error('Error setting up MFA:', error);
      throw new Error('Failed to setup MFA');
    }
  }

  /**
   * Verify MFA token
   * Requirements: 6.6 - Multi-factor authentication for sensitive operations
   */
  async verifyMfa(userId: string, token: string): Promise<MfaVerification> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { 
          mfaSecret: true, 
          twoFactorBackupCodes: true,
          permissions: true 
        }
      });

      if (!user || !user.mfaSecret) {
        return { isValid: false };
      }

      // Check if account is locked due to failed MFA attempts
      const permissions = user.permissions as any;
      if (permissions?.mfaLockedUntil && new Date(permissions.mfaLockedUntil) > new Date()) {
        return {
          isValid: false,
          lockoutUntil: new Date(permissions.mfaLockedUntil)
        };
      }

      // Verify TOTP token
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token,
        window: 2 // Allow 2 time steps (60 seconds) of drift
      });

      if (verified) {
        // Reset failed attempts on successful verification
        if (permissions?.mfaFailedAttempts) {
          await db.user.update({
            where: { id: userId },
            data: {
              permissions: {
                ...permissions,
                mfaFailedAttempts: 0,
                mfaLockedUntil: null
              }
            }
          });
        }

        await auditService.logAuditEvent({
          userId,
          action: 'VERIFY',
          resource: 'mfa_token',
          details: { success: true }
        });

        return { isValid: true };
      }

      // Check backup codes if TOTP failed
      if (user.twoFactorBackupCodes) {
        const backupCodes = user.twoFactorBackupCodes.split(',');
        const codeIndex = backupCodes.indexOf(token.toUpperCase());
        
        if (codeIndex !== -1) {
          // Remove used backup code
          backupCodes.splice(codeIndex, 1);
          await db.user.update({
            where: { id: userId },
            data: {
              twoFactorBackupCodes: backupCodes.join(',')
            }
          });

          await auditService.logAuditEvent({
            userId,
            action: 'VERIFY',
            resource: 'mfa_backup_code',
            details: { 
              success: true,
              remainingBackupCodes: backupCodes.length
            }
          });

          return { isValid: true };
        }
      }

      // Handle failed verification
      const failedAttempts = (permissions?.mfaFailedAttempts || 0) + 1;
      const maxAttempts = 5;
      
      if (failedAttempts >= maxAttempts) {
        // Lock account for 30 minutes
        const lockoutUntil = new Date(Date.now() + 30 * 60 * 1000);
        await db.user.update({
          where: { id: userId },
          data: {
            permissions: {
              ...permissions,
              mfaFailedAttempts: failedAttempts,
              mfaLockedUntil: lockoutUntil
            }
          }
        });

        await auditService.logAuditEvent({
          userId,
          action: 'CREATE',
          resource: 'security_event',
          details: {
            eventType: 'MFA_LOCKOUT',
            failedAttempts,
            lockoutUntil
          }
        });

        return {
          isValid: false,
          remainingAttempts: 0,
          lockoutUntil
        };
      } else {
        await db.user.update({
          where: { id: userId },
          data: {
            permissions: {
              ...permissions,
              mfaFailedAttempts: failedAttempts
            }
          }
        });

        await auditService.logAuditEvent({
          userId,
          action: 'VERIFY',
          resource: 'mfa_token',
          details: { 
            success: false,
            failedAttempts
          }
        });

        return {
          isValid: false,
          remainingAttempts: maxAttempts - failedAttempts
        };
      }
    } catch (error) {
      console.error('Error verifying MFA:', error);
      return { isValid: false };
    }
  }

  /**
   * Check if MFA is required for operation
   * Requirements: 6.6 - Multi-factor authentication for sensitive operations
   */
  async isMfaRequired(userId: string, operation: string): Promise<boolean> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { 
          role: true, 
          mfaEnabled: true,
          permissions: true 
        }
      });

      if (!user) {
        return false;
      }

      // Always require MFA for super admin operations
      if (user.role === 'SUPER_ADMIN') {
        return true;
      }

      // Check if MFA is temporarily required due to security event
      const permissions = user.permissions as any;
      if (permissions?.requireMfaUntil && new Date(permissions.requireMfaUntil) > new Date()) {
        return true;
      }

      // Define sensitive operations that require MFA
      const sensitiveOperations = [
        'DELETE_USER',
        'UPDATE_PERMISSIONS',
        'ACCESS_AUDIT_LOGS',
        'EXPORT_DATA',
        'SYSTEM_CONFIGURATION',
        'BILLING_OPERATIONS',
        'SECURITY_SETTINGS'
      ];

      return sensitiveOperations.includes(operation);
    } catch (error) {
      console.error('Error checking MFA requirement:', error);
      return false; // Default to not required to avoid blocking operations
    }
  }

  /**
   * Get security events
   * Requirements: 6.5 - Security event detection and automated responses
   */
  async getSecurityEvents(options?: {
    userId?: string;
    types?: SecurityEventType[];
    severity?: string[];
    status?: string[];
    limit?: number;
    offset?: number;
  }): Promise<SecurityEvent[]> {
    try {
      const whereClause: any = {
        resource: 'security_event'
      };

      if (options?.userId) {
        whereClause.userId = options.userId;
      }

      const events = await db.auditLog.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: options?.limit || 100,
        skip: options?.offset || 0
      });

      return events
        .filter(log => {
          const details = log.details as any;
          if (!details?.securityEventData) return false;

          const eventData = details.securityEventData;
          
          if (options?.types && !options.types.includes(eventData.type)) return false;
          if (options?.severity && !options.severity.includes(eventData.severity)) return false;
          if (options?.status && !options.status.includes(eventData.status)) return false;

          return true;
        })
        .map(log => (log.details as any).securityEventData as SecurityEvent);
    } catch (error) {
      console.error('Error getting security events:', error);
      throw new Error('Failed to get security events');
    }
  }
}

export const securityService = new SecurityService();