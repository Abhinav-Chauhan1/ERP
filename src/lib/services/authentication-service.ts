import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { otpService } from "./otp-service";
import { jwtService } from "./jwt-service";
import { schoolContextService } from "./school-context-service";
import { logAuditEvent } from "./audit-service";
import { rateLimitingService } from "./rate-limiting-service";
import bcrypt from "bcryptjs";

/**
 * Authentication Service
 * Implements unified authentication logic for all user types with role-based authentication methods.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5
 */

export interface AuthCredentials {
  type: 'otp' | 'password';
  value: string;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    role: UserRole;
    mobile?: string;
    email?: string;
  };
  token?: string;
  requiresSchoolSelection?: boolean;
  availableSchools?: Array<{
    id: string;
    name: string;
    schoolCode: string;
  }>;
  requiresChildSelection?: boolean;
  availableChildren?: Array<{
    id: string;
    name: string;
    class?: string;
    section?: string;
  }>;
  error?: string;
}

export interface OTPResult {
  success: boolean;
  message: string;
  expiresAt?: Date;
  error?: string;
}

export interface SessionToken {
  token: string;
  expiresAt: Date;
  user: {
    id: string;
    name: string;
    role: UserRole;
    mobile?: string;
    email?: string;
  };
  activeSchoolId?: string;
  activeStudentId?: string;
  permissions: string[];
}

// Custom errors for better error handling
export class AuthenticationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Invalid credentials provided', 'INVALID_CREDENTIALS');
  }
}

export class SchoolNotFoundError extends AuthenticationError {
  constructor(schoolCode: string) {
    super(`School not found: ${schoolCode}`, 'SCHOOL_NOT_FOUND');
  }
}

export class SchoolInactiveError extends AuthenticationError {
  constructor(schoolCode: string) {
    super(`School is inactive: ${schoolCode}`, 'SCHOOL_INACTIVE');
  }
}

export class UserNotFoundError extends AuthenticationError {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`, 'USER_NOT_FOUND');
  }
}

export class UnauthorizedSchoolError extends AuthenticationError {
  constructor(userId: string, schoolId: string) {
    super(`User ${userId} not authorized for school ${schoolId}`, 'UNAUTHORIZED_SCHOOL');
  }
}

class AuthenticationService {
  /**
   * Authenticate user with unified authentication logic
   * Determines authentication method based on user role automatically
   * Requirements: 1.1, 3.1, 3.2, 3.3, 3.4, 3.5
   */
  async authenticateUser(
    identifier: string,
    schoolId: string,
    credentials: AuthCredentials,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    try {
      // Check if identifier is blocked
      const blockedIdentifier = await rateLimitingService.isIdentifierBlocked(identifier);
      if (blockedIdentifier) {
        await this.logAuthEvent('BLOCKED', identifier, schoolId, 'IDENTIFIER_BLOCKED', ipAddress, userAgent);
        return {
          success: false,
          error: `Access blocked until ${blockedIdentifier.expiresAt.toISOString()}. Reason: ${blockedIdentifier.reason}`
        };
      }

      // Check login failure rate limiting
      const loginRateLimit = await rateLimitingService.checkLoginFailureRateLimit(identifier);
      if (!loginRateLimit.allowed) {
        await this.logAuthEvent('RATE_LIMITED', identifier, schoolId, 'LOGIN_RATE_LIMITED', ipAddress, userAgent);
        const retryAfter = Math.ceil((loginRateLimit.nextAttemptAt.getTime() - Date.now()) / 1000);
        return {
          success: false,
          error: `Too many login attempts. Please try again in ${retryAfter} seconds.`
        };
      }

      // Check for suspicious activity
      const suspiciousActivity = await rateLimitingService.checkSuspiciousActivity(identifier, ipAddress, userAgent);
      if (!suspiciousActivity.allowed) {
        await this.logAuthEvent('SUSPICIOUS', identifier, schoolId, 'SUSPICIOUS_ACTIVITY_DETECTED', ipAddress, userAgent);
        return {
          success: false,
          error: 'Suspicious activity detected. Access temporarily restricted.'
        };
      }

      // Validate school context first
      const school = await schoolContextService.validateSchoolById(schoolId);
      if (!school) {
        await rateLimitingService.recordLoginFailure(identifier, 'SCHOOL_NOT_FOUND', ipAddress, userAgent);
        throw new SchoolNotFoundError(schoolId);
      }

      // Find user by identifier (mobile or email)
      const user = await this.findUserByIdentifier(identifier);
      if (!user) {
        await rateLimitingService.recordLoginFailure(identifier, 'USER_NOT_FOUND', ipAddress, userAgent);
        await this.logAuthEvent('FAILED', identifier, schoolId, 'USER_NOT_FOUND', ipAddress, userAgent);
        throw new UserNotFoundError(identifier);
      }

      // Validate user has access to this school
      const hasSchoolAccess = await schoolContextService.validateSchoolAccess(user.id, schoolId);
      if (!hasSchoolAccess) {
        await rateLimitingService.recordLoginFailure(identifier, 'UNAUTHORIZED_SCHOOL', ipAddress, userAgent);
        await this.logAuthEvent('FAILED', user.id, schoolId, 'UNAUTHORIZED_SCHOOL', ipAddress, userAgent);
        throw new UnauthorizedSchoolError(user.id, schoolId);
      }

      // Get user's role in this school
      const userSchool = await db.userSchool.findFirst({
        where: {
          userId: user.id,
          schoolId: schoolId,
          isActive: true
        }
      });

      if (!userSchool) {
        await rateLimitingService.recordLoginFailure(identifier, 'NO_SCHOOL_ROLE', ipAddress, userAgent);
        await this.logAuthEvent('FAILED', user.id, schoolId, 'NO_SCHOOL_ROLE', ipAddress, userAgent);
        throw new UnauthorizedSchoolError(user.id, schoolId);
      }

      const userRole = userSchool.role;

      // Verify credentials based on role
      const credentialsValid = await this.verifyCredentials(user, userRole, credentials);
      if (!credentialsValid) {
        await rateLimitingService.recordLoginFailure(identifier, 'INVALID_CREDENTIALS', ipAddress, userAgent);
        await this.logAuthEvent('FAILED', user.id, schoolId, 'INVALID_CREDENTIALS', ipAddress, userAgent);
        throw new InvalidCredentialsError();
      }

      // Check if user has multiple schools
      const userSchools = await schoolContextService.getUserSchools(user.id);
      const requiresSchoolSelection = userSchools.length > 1;

      // Check if parent has multiple children (for parents only)
      let requiresChildSelection = false;
      let availableChildren: any[] = [];
      
      if (userRole === UserRole.PARENT) {
        const children = await this.getParentChildren(user.mobile || user.email!, schoolId);
        requiresChildSelection = children.length > 1;
        availableChildren = children;
      }

      // Create session token
      const sessionToken = await this.createSession(user, schoolId, userRole);

      await this.logAuthEvent('SUCCESS', user.id, schoolId, 'LOGIN_SUCCESS', ipAddress, userAgent);

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          role: userRole,
          mobile: user.mobile,
          email: user.email
        },
        token: sessionToken.token,
        requiresSchoolSelection,
        availableSchools: requiresSchoolSelection ? userSchools : undefined,
        requiresChildSelection,
        availableChildren: requiresChildSelection ? availableChildren : undefined
      };

    } catch (error) {
      console.error('Authentication error:', error);
      
      if (error instanceof AuthenticationError) {
        return {
          success: false,
          error: error.message
        };
      }

      await this.logAuthEvent('ERROR', identifier, schoolId, 'SYSTEM_ERROR', ipAddress, userAgent);
      return {
        success: false,
        error: 'Authentication system error'
      };
    }
  }

  /**
   * Generate OTP for user authentication
   * Requirements: 4.1, 4.2, 4.3, 2.2, 2.3, 8.1, 8.2
   */
  async generateOTP(identifier: string, schoolId?: string): Promise<OTPResult> {
    try {
      // Validate school context if provided
      if (schoolId) {
        const school = await schoolContextService.validateSchoolById(schoolId);
        if (!school) {
          return {
            success: false,
            message: 'School not found or inactive',
            error: 'SCHOOL_NOT_FOUND'
          };
        }
      }

      // Validate user exists
      const user = await this.findUserByIdentifier(identifier);
      if (!user) {
        return {
          success: false,
          message: 'No account found with this mobile number or email for the selected school',
          error: 'USER_NOT_FOUND'
        };
      }

      // If school context is provided, validate user has access to this school
      if (schoolId) {
        const hasSchoolAccess = await schoolContextService.validateSchoolAccess(user.id, schoolId);
        if (!hasSchoolAccess) {
          return {
            success: false,
            message: 'No account found with this mobile number or email for the selected school',
            error: 'USER_NOT_FOUND' // Use same error to avoid revealing user existence
          };
        }
      }

      // Generate OTP using OTP service
      const otpResult = await otpService.generateOTP(identifier);
      
      if (!otpResult.success) {
        return {
          success: false,
          message: otpResult.message,
          error: otpResult.error
        };
      }

      // Log OTP generation
      await this.logAuthEvent('OTP_GENERATED', user.id, schoolId, 'OTP_SENT');

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresAt: otpResult.expiresAt
      };

    } catch (error) {
      console.error('OTP generation error:', error);
      return {
        success: false,
        message: 'Failed to generate OTP',
        error: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * Verify OTP for user authentication
   * Requirements: 4.4, 4.5, 4.6
   */
  async verifyOTP(identifier: string, code: string): Promise<boolean> {
    try {
      const isValid = await otpService.verifyOTP(identifier, code);
      
      // Log verification attempt
      const user = await this.findUserByIdentifier(identifier);
      if (user) {
        await this.logAuthEvent(
          isValid ? 'OTP_VERIFIED' : 'OTP_FAILED', 
          user.id, 
          undefined, 
          isValid ? 'OTP_VALID' : 'OTP_INVALID'
        );
      }

      return isValid;
    } catch (error) {
      console.error('OTP verification error:', error);
      return false;
    }
  }

  /**
   * Validate password for user authentication
   * Requirements: 3.3, 3.4
   */
  async validatePassword(userId: string, password: string): Promise<boolean> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true }
      });

      if (!user || !user.passwordHash) {
        return false;
      }

      return await bcrypt.compare(password, user.passwordHash);
    } catch (error) {
      console.error('Password validation error:', error);
      return false;
    }
  }

  /**
   * Create session for authenticated user
   * Requirements: 11.1, 11.2, 11.3
   */
  async createSession(
    user: any,
    schoolId: string,
    role: UserRole,
    activeStudentId?: string
  ): Promise<SessionToken> {
    try {
      // Get user permissions for this school
      const permissions = await this.getUserPermissions(user.id, schoolId);

      // Create JWT token
      const tokenPayload = {
        userId: user.id,
        role: role,
        authorizedSchools: await schoolContextService.getUserSchoolIds(user.id),
        activeSchoolId: schoolId,
        activeStudentId,
        permissions: permissions.map(p => p.name)
      };

      const token = jwtService.createToken(tokenPayload);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store session in database
      await db.authSession.create({
        data: {
          userId: user.id,
          token,
          activeSchoolId: schoolId,
          expiresAt,
          lastAccessAt: new Date()
        }
      });

      return {
        token,
        expiresAt,
        user: {
          id: user.id,
          name: user.name,
          role,
          mobile: user.mobile,
          email: user.email
        },
        activeSchoolId: schoolId,
        activeStudentId,
        permissions: permissions.map(p => p.name)
      };

    } catch (error) {
      console.error('Session creation error:', error);
      throw new AuthenticationError('Failed to create session', 'SESSION_ERROR');
    }
  }

  /**
   * Refresh authentication token
   * Requirements: 11.5
   */
  async refreshToken(token: string): Promise<string | null> {
    try {
      return await jwtService.refreshToken(token);
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Revoke user session
   * Requirements: 11.4
   */
  async revokeSession(token: string): Promise<boolean> {
    try {
      // Remove from database
      await db.authSession.delete({
        where: { token }
      });

      // Revoke JWT token
      await jwtService.revokeToken(token);

      return true;
    } catch (error) {
      console.error('Session revocation error:', error);
      return false;
    }
  }

  // Private helper methods

  /**
   * Find user by mobile or email identifier
   */
  private async findUserByIdentifier(identifier: string) {
    return await db.user.findFirst({
      where: {
        OR: [
          { mobile: identifier },
          { email: identifier }
        ],
        isActive: true
      }
    });
  }

  /**
   * Verify credentials based on user role and authentication method
   */
  private async verifyCredentials(
    user: any,
    role: UserRole,
    credentials: AuthCredentials
  ): Promise<boolean> {
    switch (role) {
      case UserRole.STUDENT:
      case UserRole.PARENT:
        // Students and parents use OTP only
        if (credentials.type !== 'otp') {
          return false;
        }
        return await this.verifyOTP(user.mobile || user.email, credentials.value);

      case UserRole.TEACHER:
        // Teachers can use both OTP and password
        if (credentials.type === 'otp') {
          return await this.verifyOTP(user.mobile || user.email, credentials.value);
        } else if (credentials.type === 'password') {
          return await this.validatePassword(user.id, credentials.value);
        }
        return false;

      case UserRole.ADMIN:
        // School admins use password (with optional OTP)
        if (credentials.type === 'password') {
          return await this.validatePassword(user.id, credentials.value);
        } else if (credentials.type === 'otp') {
          // Optional OTP for school admins
          return await this.verifyOTP(user.mobile || user.email, credentials.value);
        }
        return false;

      case UserRole.SUPER_ADMIN:
        // Super admins use password only (handled separately)
        if (credentials.type === 'password') {
          return await this.validatePassword(user.id, credentials.value);
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Get parent's children in a specific school
   */
  private async getParentChildren(parentIdentifier: string, schoolId: string) {
    const students = await db.student.findMany({
      where: {
        parentMobile: parentIdentifier,
        schoolId: schoolId
      },
      select: {
        id: true,
        name: true,
        class: true,
        section: true
      }
    });

    return students;
  }

  /**
   * Get user permissions for a specific school
   */
  private async getUserPermissions(userId: string, schoolId: string) {
    // Get role-based permissions
    const userSchool = await db.userSchool.findFirst({
      where: {
        userId,
        schoolId,
        isActive: true
      }
    });

    if (!userSchool) {
      return [];
    }

    // Get permissions based on role
    const rolePermissions = await db.rolePermission.findMany({
      where: {
        role: userSchool.role
      },
      include: {
        permission: true
      }
    });

    // Get user-specific permissions
    const userPermissions = await db.userPermission.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        permission: true
      }
    });

    // Combine and deduplicate permissions
    const allPermissions = [
      ...rolePermissions.map(rp => rp.permission),
      ...userPermissions.map(up => up.permission)
    ];

    // Remove duplicates based on permission ID
    const uniquePermissions = allPermissions.filter((permission, index, self) =>
      index === self.findIndex(p => p.id === permission.id)
    );

    return uniquePermissions;
  }

  /**
   * Log authentication events for audit
   */
  private async logAuthEvent(
    action: string,
    userId: string,
    schoolId?: string,
    details?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await logAuditEvent({
        userId,
        schoolId,
        action: action as any, // Cast to avoid type issues
        resource: 'authentication',
        changes: {
          details,
          ipAddress,
          userAgent,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log auth event:', error);
      // Don't throw error to avoid breaking authentication flow
    }
  }
}

export const authenticationService = new AuthenticationService();