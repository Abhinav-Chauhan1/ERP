import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * JWT Service
 * Manages JWT token creation, validation, and refresh with secure claims.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

export interface TokenPayload {
  userId: string;
  role: UserRole;
  authorizedSchools: string[];
  activeSchoolId?: string;
  activeStudentId?: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}

// Custom errors for better error handling
export class JWTError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'JWTError';
  }
}

export class TokenExpiredError extends JWTError {
  constructor() {
    super('Token has expired', 'TOKEN_EXPIRED');
  }
}

export class TokenInvalidError extends JWTError {
  constructor() {
    super('Invalid token', 'TOKEN_INVALID');
  }
}

export class TokenRevokedError extends JWTError {
  constructor() {
    super('Token has been revoked', 'TOKEN_REVOKED');
  }
}

class JWTService {
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly TOKEN_EXPIRY = '24h';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.warn('JWT secrets not properly configured. Using default values.');
    }
  }

  /**
   * Create JWT token with user payload
   * Requirements: 11.1
   */
  createToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    try {
      // Don't manually set iat and exp - let jwt.sign() handle them
      const tokenPayload = {
        ...payload
      };

      const token = jwt.sign(tokenPayload, this.JWT_SECRET, {
        expiresIn: this.TOKEN_EXPIRY,
        issuer: 'school-erp-saas',
        audience: 'school-users'
      });

      this.logTokenEvent('CREATED', payload.userId, 'TOKEN_CREATED', {
        role: payload.role,
        schoolCount: payload.authorizedSchools.length,
        activeSchoolId: payload.activeSchoolId
      });

      return token;

    } catch (error) {
      console.error('Token creation error:', error);
      this.logTokenEvent('ERROR', payload.userId, 'TOKEN_CREATION_FAILED');
      throw new JWTError('Failed to create token', 'CREATION_ERROR');
    }
  }

  /**
   * Verify and decode JWT token
   * Requirements: 11.3
   */
  async verifyToken(token: string): Promise<TokenValidationResult> {
    try {
      // Check if token is revoked
      const isRevoked = await this.isTokenRevoked(token);
      if (isRevoked) {
        this.logTokenEvent('VALIDATION_FAILED', null, 'TOKEN_REVOKED');
        return {
          valid: false,
          error: 'TOKEN_REVOKED'
        };
      }

      // Verify token signature and expiration
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'school-erp-saas',
        audience: 'school-users'
      }) as TokenPayload;

      // Additional validation
      if (!decoded.userId || !decoded.role) {
        this.logTokenEvent('VALIDATION_FAILED', decoded.userId, 'INVALID_PAYLOAD');
        return {
          valid: false,
          error: 'INVALID_PAYLOAD'
        };
      }

      // Update last access time in session
      await this.updateSessionAccess(token);

      this.logTokenEvent('VALIDATED', decoded.userId, 'TOKEN_VALID');

      return {
        valid: true,
        payload: decoded
      };

    } catch (error) {
      console.error('Token verification error:', error);
      
      if (error instanceof jwt.TokenExpiredError) {
        this.logTokenEvent('VALIDATION_FAILED', null, 'TOKEN_EXPIRED');
        return {
          valid: false,
          error: 'TOKEN_EXPIRED'
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        this.logTokenEvent('VALIDATION_FAILED', null, 'TOKEN_INVALID');
        return {
          valid: false,
          error: 'TOKEN_INVALID'
        };
      }

      this.logTokenEvent('VALIDATION_ERROR', null, 'SYSTEM_ERROR');
      return {
        valid: false,
        error: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Refresh JWT token
   * Requirements: 11.5
   */
  async refreshToken(token: string): Promise<string | null> {
    try {
      // Verify the current token (even if expired)
      let decoded: TokenPayload;
      
      try {
        decoded = jwt.verify(token, this.JWT_SECRET, {
          ignoreExpiration: true,
          issuer: 'school-erp-saas',
          audience: 'school-users'
        }) as TokenPayload;
      } catch (error) {
        this.logTokenEvent('REFRESH_FAILED', null, 'INVALID_TOKEN_FOR_REFRESH');
        return null;
      }

      // Check if token is revoked
      const isRevoked = await this.isTokenRevoked(token);
      if (isRevoked) {
        this.logTokenEvent('REFRESH_FAILED', decoded.userId, 'TOKEN_REVOKED');
        return null;
      }

      // Check if token is not too old (within refresh window)
      const tokenAge = Date.now() / 1000 - decoded.iat;
      const maxRefreshAge = 7 * 24 * 60 * 60; // 7 days
      
      if (tokenAge > maxRefreshAge) {
        this.logTokenEvent('REFRESH_FAILED', decoded.userId, 'TOKEN_TOO_OLD');
        return null;
      }

      // Get fresh user data and permissions
      const freshPayload = await this.getFreshTokenPayload(decoded.userId, decoded.activeSchoolId);
      if (!freshPayload) {
        this.logTokenEvent('REFRESH_FAILED', decoded.userId, 'USER_DATA_UNAVAILABLE');
        return null;
      }

      // Create new token
      const newToken = this.createToken(freshPayload);

      // Revoke old token
      await this.revokeToken(token);

      this.logTokenEvent('REFRESHED', decoded.userId, 'TOKEN_REFRESHED');

      return newToken;

    } catch (error) {
      console.error('Token refresh error:', error);
      this.logTokenEvent('REFRESH_ERROR', null, 'SYSTEM_ERROR');
      return null;
    }
  }

  /**
   * Revoke JWT token
   * Requirements: 11.4
   */
  async revokeToken(token: string): Promise<void> {
    try {
      // Add token to revoked tokens list (using audit log for now)
      try {
        const { logAuditEvent } = await import('./audit-service');
        await logAuditEvent({
          userId: null,
          action: 'DELETE' as any,
          resource: 'jwt_token',
          resourceId: this.getTokenHash(token),
          changes: {
            tokenHash: this.getTokenHash(token),
            revokedAt: new Date(),
            reason: 'MANUAL_REVOCATION'
          }
        });
      } catch (auditError) {
        console.error('Failed to log token revocation:', auditError);
      }

      // Remove from active sessions
      await db.authSession.deleteMany({
        where: { token }
      });

      this.logTokenEvent('REVOKED', null, 'TOKEN_REVOKED');

    } catch (error) {
      console.error('Token revocation error:', error);
      this.logTokenEvent('REVOCATION_ERROR', null, 'SYSTEM_ERROR');
      throw new JWTError('Failed to revoke token', 'REVOCATION_ERROR');
    }
  }

  /**
   * Extract payload from token without verification (for debugging)
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }

  /**
   * Check if token will expire soon (within 1 hour)
   */
  isTokenExpiringSoon(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return true;

      const expirationTime = decoded.exp * 1000;
      const oneHourFromNow = Date.now() + (60 * 60 * 1000);

      return expirationTime < oneHourFromNow;
    } catch (error) {
      return true;
    }
  }

  // Private helper methods

  /**
   * Check if token is in revoked tokens list
   */
  private async isTokenRevoked(token: string): Promise<boolean> {
    try {
      const tokenHash = this.getTokenHash(token);
      
      const revokedToken = await db.auditLog.findFirst({
        where: {
          resource: 'jwt_token',
          resourceId: tokenHash,
          action: 'DELETE' as any
        }
      });

      return !!revokedToken;
    } catch (error) {
      console.error('Token revocation check error:', error);
      return false;
    }
  }

  /**
   * Update session last access time
   */
  private async updateSessionAccess(token: string): Promise<void> {
    try {
      await db.authSession.updateMany({
        where: { token },
        data: { lastAccessAt: new Date() }
      });
    } catch (error) {
      console.error('Session access update error:', error);
      // Don't throw error to avoid breaking token validation
    }
  }

  /**
   * Get fresh token payload for refresh
   */
  private async getFreshTokenPayload(
    userId: string,
    activeSchoolId?: string
  ): Promise<Omit<TokenPayload, 'iat' | 'exp'> | null> {
    try {
      // Get user with current role and schools
      const user = await db.user.findUnique({
        where: { id: userId, isActive: true },
        include: {
          userSchools: {
            where: { isActive: true },
            include: { school: true }
          }
        }
      });

      if (!user) {
        return null;
      }

      // Get authorized schools
      const authorizedSchools = user.userSchools
        .filter(us => us.school.status === 'ACTIVE')
        .map(us => us.schoolId);

      // Get current role (from active school or first school)
      let currentRole = user.userSchools[0]?.role || UserRole.STUDENT;
      if (activeSchoolId) {
        const activeUserSchool = user.userSchools.find(us => us.schoolId === activeSchoolId);
        if (activeUserSchool) {
          currentRole = activeUserSchool.role;
        }
      }

      // Get permissions (simplified - you might want to implement proper permission fetching)
      const permissions: string[] = [];

      return {
        userId: user.id,
        role: currentRole,
        authorizedSchools,
        activeSchoolId,
        permissions
      };

    } catch (error) {
      console.error('Get fresh token payload error:', error);
      return null;
    }
  }

  /**
   * Generate hash for token (for revocation tracking)
   */
  private getTokenHash(token: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Log token events for audit
   */
  private async logTokenEvent(
    action: string,
    userId: string | null,
    details: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { logAuditEvent } = await import('./audit-service');
      await logAuditEvent({
        userId: userId || null,
        action: action as any, // Cast to avoid type issues
        resource: 'jwt_token',
        changes: {
          details,
          metadata,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log token event:', error);
      // Don't throw error to avoid breaking token flow
    }
  }
}

export const jwtService = new JWTService();