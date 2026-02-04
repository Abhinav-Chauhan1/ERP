import { UserRole, AuditAction } from '@prisma/client';
import { logAuditEvent } from '@/lib/services/audit-service';
import { NextRequest } from 'next/server';

/**
 * Authentication Audit Logger
 * Provides comprehensive audit logging for all authentication events
 * with structured data and security monitoring capabilities.
 * 
 * Requirements: 12.5, 8.5, 15.1, 15.2, 15.3, 15.4
 */

export interface AuthAuditEvent {
  action: AuthAuditAction;
  userId?: string | null;
  schoolId?: string | null;
  result: 'SUCCESS' | 'FAILURE' | 'ERROR' | 'WARNING';
  details: string;
  metadata: AuthAuditMetadata;
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface AuthAuditMetadata {
  path: string;
  method: string;
  role?: UserRole;
  schoolCode?: string;
  tokenType?: 'JWT' | 'SESSION' | 'API_KEY';
  authMethod?: 'PASSWORD' | 'OTP' | 'TOKEN';
  failureReason?: string;
  duration?: number;
  requestId?: string;
  sessionId?: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
  geoLocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
  riskScore?: number;
  additionalData?: Record<string, any>;
}

export enum AuthAuditAction {
  // Authentication Events
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_REVOCATION = 'TOKEN_REVOCATION',
  
  // Authorization Events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHECK = 'PERMISSION_CHECK',
  ROLE_VALIDATION = 'ROLE_VALIDATION',
  
  // School Context Events
  SCHOOL_CONTEXT_SWITCH = 'SCHOOL_CONTEXT_SWITCH',
  SCHOOL_ACCESS_VALIDATION = 'SCHOOL_ACCESS_VALIDATION',
  TENANT_ISOLATION_CHECK = 'TENANT_ISOLATION_CHECK',
  
  // Security Events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  
  // OTP Events
  OTP_GENERATED = 'OTP_GENERATED',
  OTP_VERIFIED = 'OTP_VERIFIED',
  OTP_FAILED = 'OTP_FAILED',
  OTP_EXPIRED = 'OTP_EXPIRED',
  
  // Session Events
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INVALIDATED = 'SESSION_INVALIDATED',
  
  // Administrative Events
  USER_ACCOUNT_LOCKED = 'USER_ACCOUNT_LOCKED',
  USER_ACCOUNT_UNLOCKED = 'USER_ACCOUNT_UNLOCKED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  
  // System Events
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

/**
 * Maps AuthAuditAction to AuditAction for database storage
 */
function mapAuthAuditActionToAuditAction(authAction: AuthAuditAction): AuditAction {
  switch (authAction) {
    case AuthAuditAction.LOGIN_ATTEMPT:
    case AuthAuditAction.LOGIN_SUCCESS:
    case AuthAuditAction.LOGIN_FAILURE:
      return AuditAction.LOGIN;
    case AuthAuditAction.LOGOUT:
      return AuditAction.LOGOUT;
    case AuthAuditAction.ACCESS_GRANTED:
    case AuthAuditAction.ACCESS_DENIED:
    case AuthAuditAction.PERMISSION_CHECK:
    case AuthAuditAction.ROLE_VALIDATION:
      return AuditAction.VIEW;
    case AuthAuditAction.SCHOOL_CONTEXT_SWITCH:
    case AuthAuditAction.SCHOOL_ACCESS_VALIDATION:
    case AuthAuditAction.TENANT_ISOLATION_CHECK:
      return AuditAction.UPDATE;
    case AuthAuditAction.OTP_GENERATED:
    case AuthAuditAction.SESSION_CREATED:
      return AuditAction.CREATE;
    case AuthAuditAction.OTP_VERIFIED:
    case AuthAuditAction.OTP_FAILED:
    case AuthAuditAction.OTP_EXPIRED:
      return AuditAction.VERIFY;
    case AuthAuditAction.SESSION_EXPIRED:
    case AuthAuditAction.SESSION_INVALIDATED:
      return AuditAction.DELETE;
    case AuthAuditAction.USER_ACCOUNT_LOCKED:
    case AuthAuditAction.USER_ACCOUNT_UNLOCKED:
    case AuthAuditAction.PERMISSION_GRANTED:
    case AuthAuditAction.PERMISSION_REVOKED:
      return AuditAction.UPDATE;
    default:
      return AuditAction.VIEW; // Default fallback
  }
}

class AuthAuditLogger {
  private readonly MAX_METADATA_SIZE = 10000; // 10KB limit for metadata
  private readonly SENSITIVE_FIELDS = ['password', 'token', 'secret', 'key', 'otp'];

  /**
   * Log authentication event with comprehensive metadata
   * Requirements: 12.5, 15.1, 15.2, 15.3, 15.4
   */
  async logAuthEvent(event: Partial<AuthAuditEvent>): Promise<void> {
    try {
      const sanitizedEvent = this.sanitizeEvent(event);
      const enrichedEvent = await this.enrichEvent(sanitizedEvent);
      
      await logAuditEvent({
        userId: enrichedEvent.userId || null,
        schoolId: enrichedEvent.schoolId || undefined,
        action: mapAuthAuditActionToAuditAction(enrichedEvent.action),
        resource: 'authentication',
        resourceId: enrichedEvent.metadata.sessionId || enrichedEvent.metadata.requestId,
        changes: {
          result: enrichedEvent.result,
          details: enrichedEvent.details,
          securityLevel: enrichedEvent.securityLevel,
          metadata: enrichedEvent.metadata,
          ipAddress: enrichedEvent.ipAddress,
          userAgent: enrichedEvent.userAgent,
          timestamp: enrichedEvent.timestamp
        }
      });

      // Log to console for development/debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth Audit Event:', {
          action: enrichedEvent.action,
          result: enrichedEvent.result,
          userId: enrichedEvent.userId,
          schoolId: enrichedEvent.schoolId,
          details: enrichedEvent.details,
          securityLevel: enrichedEvent.securityLevel
        });
      }

      // Send alerts for critical security events
      if (enrichedEvent.securityLevel === 'CRITICAL') {
        await this.sendSecurityAlert(enrichedEvent);
      }

    } catch (error) {
      console.error('Failed to log auth audit event:', error);
      // Don't throw error to avoid breaking authentication flow
    }
  }

  /**
   * Log successful authentication
   * Requirements: 15.1
   */
  async logSuccessfulAuth(
    userId: string,
    role: UserRole,
    schoolId?: string,
    request?: NextRequest,
    metadata?: Partial<AuthAuditMetadata>
  ): Promise<void> {
    await this.logAuthEvent({
      action: AuthAuditAction.LOGIN_SUCCESS,
      userId,
      schoolId,
      result: 'SUCCESS',
      details: `User successfully authenticated with role ${role}`,
      securityLevel: 'LOW',
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || 'Unknown',
      timestamp: new Date(),
      metadata: {
        path: request ? new URL(request.url).pathname : 'unknown',
        method: request?.method || 'unknown',
        role,
        authMethod: 'TOKEN',
        ...metadata
      }
    });
  }

  /**
   * Log failed authentication
   * Requirements: 15.2
   */
  async logFailedAuth(
    identifier: string,
    reason: string,
    request?: NextRequest,
    metadata?: Partial<AuthAuditMetadata>
  ): Promise<void> {
    await this.logAuthEvent({
      action: AuthAuditAction.LOGIN_FAILURE,
      result: 'FAILURE',
      details: `Authentication failed for ${identifier}: ${reason}`,
      securityLevel: this.getSecurityLevelForFailure(reason),
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || 'Unknown',
      timestamp: new Date(),
      metadata: {
        path: request ? new URL(request.url).pathname : 'unknown',
        method: request?.method || 'unknown',
        failureReason: reason,
        ...metadata
      }
    });
  }

  /**
   * Log school context switch
   * Requirements: 15.3
   */
  async logSchoolContextSwitch(
    userId: string,
    fromSchoolId: string | null,
    toSchoolId: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent({
      action: AuthAuditAction.SCHOOL_CONTEXT_SWITCH,
      userId,
      schoolId: toSchoolId,
      result: 'SUCCESS',
      details: `School context switched from ${fromSchoolId || 'none'} to ${toSchoolId}`,
      securityLevel: 'MEDIUM',
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || 'Unknown',
      timestamp: new Date(),
      metadata: {
        path: request ? new URL(request.url).pathname : 'unknown',
        method: request?.method || 'unknown',
        additionalData: {
          fromSchoolId,
          toSchoolId
        }
      }
    });
  }

  /**
   * Log access denied event
   * Requirements: 15.2, 15.4
   */
  async logAccessDenied(
    userId: string | null,
    reason: string,
    resource: string,
    request?: NextRequest,
    metadata?: Partial<AuthAuditMetadata>
  ): Promise<void> {
    await this.logAuthEvent({
      action: AuthAuditAction.ACCESS_DENIED,
      userId,
      result: 'FAILURE',
      details: `Access denied to ${resource}: ${reason}`,
      securityLevel: 'HIGH',
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || 'Unknown',
      timestamp: new Date(),
      metadata: {
        path: request ? new URL(request.url).pathname : 'unknown',
        method: request?.method || 'unknown',
        failureReason: reason,
        additionalData: {
          resource
        },
        ...metadata
      }
    });
  }

  /**
   * Log suspicious activity
   * Requirements: 15.4
   */
  async logSuspiciousActivity(
    description: string,
    userId?: string,
    schoolId?: string,
    request?: NextRequest,
    riskScore?: number
  ): Promise<void> {
    await this.logAuthEvent({
      action: AuthAuditAction.SUSPICIOUS_ACTIVITY,
      userId,
      schoolId,
      result: 'WARNING',
      details: `Suspicious activity detected: ${description}`,
      securityLevel: 'CRITICAL',
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || 'Unknown',
      timestamp: new Date(),
      metadata: {
        path: request ? new URL(request.url).pathname : 'unknown',
        method: request?.method || 'unknown',
        riskScore,
        additionalData: {
          description
        }
      }
    });
  }

  /**
   * Log OTP events
   * Requirements: 15.1, 15.2
   */
  async logOTPEvent(
    action: AuthAuditAction.OTP_GENERATED | AuthAuditAction.OTP_VERIFIED | AuthAuditAction.OTP_FAILED | AuthAuditAction.OTP_EXPIRED,
    identifier: string,
    result: 'SUCCESS' | 'FAILURE',
    details: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent({
      action,
      result,
      details: `OTP ${action.toLowerCase().replace('otp_', '')} for ${identifier}: ${details}`,
      securityLevel: result === 'FAILURE' ? 'MEDIUM' : 'LOW',
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || 'Unknown',
      timestamp: new Date(),
      metadata: {
        path: request ? new URL(request.url).pathname : 'unknown',
        method: request?.method || 'unknown',
        authMethod: 'OTP',
        additionalData: {
          identifier: this.maskSensitiveData(identifier)
        }
      }
    });
  }

  /**
   * Log administrative actions
   * Requirements: 15.4
   */
  async logAdminAction(
    adminUserId: string,
    action: string,
    targetUserId?: string,
    schoolId?: string,
    details?: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent({
      action: AuthAuditAction.PERMISSION_GRANTED, // Generic admin action
      userId: adminUserId,
      schoolId,
      result: 'SUCCESS',
      details: `Admin action: ${action}${details ? ` - ${details}` : ''}`,
      securityLevel: 'HIGH',
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || 'Unknown',
      timestamp: new Date(),
      metadata: {
        path: request ? new URL(request.url).pathname : 'unknown',
        method: request?.method || 'unknown',
        additionalData: {
          adminAction: action,
          targetUserId
        }
      }
    });
  }

  // Private helper methods

  /**
   * Sanitize event data to remove sensitive information
   */
  private sanitizeEvent(event: Partial<AuthAuditEvent>): AuthAuditEvent {
    const sanitized = { ...event } as AuthAuditEvent;
    
    // Ensure required fields
    sanitized.timestamp = sanitized.timestamp || new Date();
    sanitized.result = sanitized.result || 'SUCCESS';
    sanitized.securityLevel = sanitized.securityLevel || 'LOW';
    sanitized.ipAddress = sanitized.ipAddress || 'unknown';
    sanitized.userAgent = sanitized.userAgent || 'unknown';
    sanitized.metadata = sanitized.metadata || {} as AuthAuditMetadata;

    // Sanitize metadata
    if (sanitized.metadata.additionalData) {
      sanitized.metadata.additionalData = this.sanitizeObject(sanitized.metadata.additionalData);
    }

    // Limit metadata size
    const metadataString = JSON.stringify(sanitized.metadata);
    if (metadataString.length > this.MAX_METADATA_SIZE) {
      sanitized.metadata.additionalData = { truncated: true, originalSize: metadataString.length };
    }

    return sanitized;
  }

  /**
   * Enrich event with additional context
   */
  private async enrichEvent(event: AuthAuditEvent): Promise<AuthAuditEvent> {
    // Add request ID if available
    if (!event.metadata.requestId) {
      event.metadata.requestId = this.generateRequestId();
    }

    // Parse user agent for device info
    if (event.userAgent && event.userAgent !== 'unknown') {
      event.metadata.deviceInfo = this.parseUserAgent(event.userAgent);
    }

    // Add geo location if IP is available (mock implementation)
    if (event.ipAddress && event.ipAddress !== 'unknown') {
      event.metadata.geoLocation = await this.getGeoLocation(event.ipAddress);
    }

    return event;
  }

  /**
   * Sanitize object by removing sensitive fields
   */
  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (this.SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = this.maskSensitiveData(String(value));
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Mask sensitive data
   */
  private maskSensitiveData(data: string): string {
    if (data.length <= 4) {
      return '*'.repeat(data.length);
    }
    return data.substring(0, 2) + '*'.repeat(data.length - 4) + data.substring(data.length - 2);
  }

  /**
   * Get security level based on failure reason
   */
  private getSecurityLevelForFailure(reason: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalReasons = ['brute_force', 'suspicious_activity', 'account_locked'];
    const highReasons = ['invalid_token', 'expired_token', 'unauthorized_access'];
    const mediumReasons = ['invalid_credentials', 'otp_failed', 'permission_denied'];
    
    const lowerReason = reason.toLowerCase();
    
    if (criticalReasons.some(r => lowerReason.includes(r))) return 'CRITICAL';
    if (highReasons.some(r => lowerReason.includes(r))) return 'HIGH';
    if (mediumReasons.some(r => lowerReason.includes(r))) return 'MEDIUM';
    
    return 'LOW';
  }

  /**
   * Get client IP address
   */
  private getClientIP(request?: NextRequest): string {
    if (!request) return 'unknown';
    
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    return 'unknown';
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Parse user agent for device information
   */
  private parseUserAgent(userAgent: string): AuthAuditMetadata['deviceInfo'] {
    // Simple user agent parsing (in production, use a proper library)
    const deviceInfo: AuthAuditMetadata['deviceInfo'] = {};
    
    if (userAgent.includes('Chrome')) deviceInfo.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) deviceInfo.browser = 'Firefox';
    else if (userAgent.includes('Safari')) deviceInfo.browser = 'Safari';
    else if (userAgent.includes('Edge')) deviceInfo.browser = 'Edge';
    
    if (userAgent.includes('Windows')) deviceInfo.os = 'Windows';
    else if (userAgent.includes('Mac')) deviceInfo.os = 'macOS';
    else if (userAgent.includes('Linux')) deviceInfo.os = 'Linux';
    else if (userAgent.includes('Android')) deviceInfo.os = 'Android';
    else if (userAgent.includes('iOS')) deviceInfo.os = 'iOS';
    
    if (userAgent.includes('Mobile')) deviceInfo.device = 'Mobile';
    else if (userAgent.includes('Tablet')) deviceInfo.device = 'Tablet';
    else deviceInfo.device = 'Desktop';
    
    return deviceInfo;
  }

  /**
   * Get geo location from IP (mock implementation)
   */
  private async getGeoLocation(ipAddress: string): Promise<AuthAuditMetadata['geoLocation']> {
    // In production, integrate with a geo-location service
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown'
    };
  }

  /**
   * Send security alert for critical events
   */
  private async sendSecurityAlert(event: AuthAuditEvent): Promise<void> {
    try {
      // In production, integrate with alerting system (email, Slack, etc.)
      console.warn('SECURITY ALERT:', {
        action: event.action,
        details: event.details,
        userId: event.userId,
        schoolId: event.schoolId,
        ipAddress: event.ipAddress,
        timestamp: event.timestamp
      });
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }
}

export const authAuditLogger = new AuthAuditLogger();