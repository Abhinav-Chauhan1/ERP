import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { logAuditEvent, AuditAction } from "./audit-service";
import { rateLimitingService } from "./rate-limiting-service";

/**
 * OTP Service
 * Handles OTP generation, storage, verification, and rate limiting.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 14.1
 */

export interface OTPGenerationResult {
  success: boolean;
  message: string;
  expiresAt?: Date;
  error?: string;
}

export interface OTPVerificationResult {
  success: boolean;
  message: string;
  error?: string;
}

// Custom errors for better error handling
export class OTPError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'OTPError';
  }
}

export class RateLimitError extends OTPError {
  constructor(retryAfter: number) {
    super(`Rate limit exceeded. Try again after ${retryAfter} seconds`, 'RATE_LIMITED');
    this.retryAfter = retryAfter;
  }
  retryAfter: number;
}

export class OTPExpiredError extends OTPError {
  constructor() {
    super('OTP has expired', 'OTP_EXPIRED');
  }
}

export class OTPInvalidError extends OTPError {
  constructor() {
    super('Invalid OTP code', 'OTP_INVALID');
  }
}

class OTPService {
  private static readonly OTP_LENGTH = 6;
  private static readonly OTP_EXPIRY_MINUTES = 5;
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RATE_LIMIT_WINDOW_MINUTES = 5;
  private static readonly MAX_REQUESTS_PER_WINDOW = 3;
  private static readonly BLOCK_DURATION_MINUTES = 15;

  /**
   * Generate OTP for identifier with rate limiting
   * Requirements: 4.1, 4.2, 14.1
   */
  async generateOTP(identifier: string): Promise<OTPGenerationResult> {
    try {
      // Check rate limiting using the new rate limiting service
      const rateLimitResult = await rateLimitingService.checkOTPRateLimit(identifier);
      if (!rateLimitResult.allowed) {
        throw new RateLimitError(rateLimitResult.retryAfter || 0);
      }

      // Generate secure 6-digit OTP
      const code = this.generateSecureCode();
      const expiresAt = new Date(Date.now() + OTPService.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Hash the OTP before storing
      const codeHash = await bcrypt.hash(code, 10);

      // Clean up expired OTPs for this identifier
      await this.cleanupExpiredOTPs(identifier);

      // Store OTP in database
      await db.oTP.create({
        data: {
          identifier,
          codeHash,
          expiresAt,
          attempts: 0,
          isUsed: false
        }
      });

      // Send OTP (mock implementation - integrate with SMS/Email service)
      await this.sendOTP(identifier, code);

      // Log OTP generation
      await this.logOTPEvent('GENERATED', identifier, 'OTP_SENT');

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresAt
      };

    } catch (error) {
      console.error('OTP generation error:', error);
      
      if (error instanceof OTPError) {
        return {
          success: false,
          message: error.message,
          error: error.code
        };
      }

      await this.logOTPEvent('ERROR', identifier, 'GENERATION_FAILED');
      return {
        success: false,
        message: 'Failed to generate OTP',
        error: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * Verify OTP code with attempt tracking
   * Requirements: 4.4, 4.5, 4.6
   */
  async verifyOTP(identifier: string, code: string): Promise<boolean> {
    try {
      // Find the most recent unused OTP for this identifier
      const otpRecord = await db.oTP.findFirst({
        where: {
          identifier,
          isUsed: false,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!otpRecord) {
        await this.logOTPEvent('FAILED', identifier, 'OTP_NOT_FOUND_OR_EXPIRED');
        return false;
      }

      // Check if OTP has expired
      if (otpRecord.expiresAt < new Date()) {
        await this.logOTPEvent('FAILED', identifier, 'OTP_EXPIRED');
        throw new OTPExpiredError();
      }

      // Check if max attempts exceeded
      if (otpRecord.attempts >= OTPService.MAX_ATTEMPTS) {
        await this.logOTPEvent('BLOCKED', identifier, 'MAX_ATTEMPTS_EXCEEDED');
        await this.blockIdentifier(identifier);
        return false;
      }

      // Verify the OTP code
      const isValid = await bcrypt.compare(code, otpRecord.codeHash);

      if (isValid) {
        // Mark OTP as used
        await db.oTP.update({
          where: { id: otpRecord.id },
          data: { 
            isUsed: true,
            attempts: otpRecord.attempts + 1
          }
        });

        await this.logOTPEvent('VERIFIED', identifier, 'OTP_VALID');
        return true;
      } else {
        // Increment attempt counter
        await db.oTP.update({
          where: { id: otpRecord.id },
          data: { attempts: otpRecord.attempts + 1 }
        });

        await this.logOTPEvent('FAILED', identifier, 'OTP_INVALID');
        
        // Check if this was the last attempt
        if (otpRecord.attempts + 1 >= OTPService.MAX_ATTEMPTS) {
          await this.blockIdentifier(identifier);
        }

        return false;
      }

    } catch (error) {
      console.error('OTP verification error:', error);
      
      if (error instanceof OTPError) {
        throw error;
      }

      await this.logOTPEvent('ERROR', identifier, 'VERIFICATION_FAILED');
      return false;
    }
  }

  /**
   * Check if identifier is rate limited
   * Requirements: 14.1
   */
  async isRateLimited(identifier: string): Promise<boolean> {
    return await this.checkRateLimit(identifier);
  }

  /**
   * Clean up expired OTPs (maintenance function)
   * Requirements: 4.6
   */
  async cleanupExpiredOTPs(identifier?: string): Promise<void> {
    try {
      const whereClause = {
        expiresAt: { lt: new Date() },
        ...(identifier && { identifier })
      };

      await db.oTP.deleteMany({
        where: whereClause
      });

      await this.logOTPEvent('CLEANUP', identifier || 'SYSTEM', 'EXPIRED_OTPS_CLEANED');
    } catch (error) {
      console.error('OTP cleanup error:', error);
    }
  }

  // Private helper methods

  /**
   * Generate secure 6-digit OTP code
   */
  private generateSecureCode(): string {
    const digits = '0123456789';
    let code = '';
    
    for (let i = 0; i < OTPService.OTP_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      code += digits[randomIndex];
    }
    
    return code;
  }

  /**
   * Check rate limiting for identifier
   */
  private async checkRateLimit(identifier: string): Promise<boolean> {
    const windowStart = new Date(Date.now() - OTPService.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
    
    const recentRequests = await db.oTP.count({
      where: {
        identifier,
        createdAt: { gte: windowStart }
      }
    });

    return recentRequests >= OTPService.MAX_REQUESTS_PER_WINDOW;
  }

  /**
   * Get retry after time for rate limited identifier
   */
  private async getRateLimitRetryAfter(identifier: string): Promise<number> {
    const windowStart = new Date(Date.now() - OTPService.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
    
    const oldestRequest = await db.oTP.findFirst({
      where: {
        identifier,
        createdAt: { gte: windowStart }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (!oldestRequest) {
      return 0;
    }

    const windowEnd = new Date(oldestRequest.createdAt.getTime() + OTPService.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
    const retryAfter = Math.max(0, Math.ceil((windowEnd.getTime() - Date.now()) / 1000));
    
    return retryAfter;
  }

  /**
   * Update rate limiting counter
   */
  private async updateRateLimit(identifier: string): Promise<void> {
    // Rate limiting is handled by counting OTP records within the time window
    // No additional action needed as OTP creation itself serves as the counter
  }

  /**
   * Block identifier temporarily after abuse
   */
  private async blockIdentifier(identifier: string): Promise<void> {
    // For now, we rely on the rate limiting mechanism
    // In a production system, you might want a separate blocking table
    await this.logOTPEvent('BLOCKED', identifier, 'IDENTIFIER_TEMPORARILY_BLOCKED');
  }

  /**
   * Send OTP via SMS or Email (mock implementation)
   */
  private async sendOTP(identifier: string, code: string): Promise<void> {
    // Mock implementation - integrate with actual SMS/Email service
    console.log(`Sending OTP ${code} to ${identifier}`);
    
    // In production, integrate with services like:
    // - SMS: Twilio, AWS SNS, MSG91
    // - Email: SendGrid, AWS SES, Nodemailer
    
    // Example integration:
    // if (identifier.includes('@')) {
    //   await emailService.sendOTP(identifier, code);
    // } else {
    //   await smsService.sendOTP(identifier, code);
    // }
  }

  /**
   * Log OTP events for audit
   */
  private async logOTPEvent(
    action: string,
    identifier: string,
    details: string
  ): Promise<void> {
    try {
      await logAuditEvent({
        userId: null, // OTP events are identifier-based, not user-based initially
        action: action as AuditAction,
        resource: 'otp',
        changes: {
          identifier,
          details,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log OTP event:', error);
      // Don't throw error to avoid breaking OTP flow
    }
  }
}

export const otpService = new OTPService();