import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { schoolSecuritySettingsService } from '@/lib/services/school-security-settings-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const securitySettingsSchema = z.object({
  settings: z.object({
    twoFactorAuth: z.object({
      enabled: z.boolean(),
      required: z.boolean(),
      methods: z.array(z.string()),
    }).optional(),
    sessionManagement: z.object({
      sessionTimeout: z.number().min(15).max(1440),
      maxConcurrentSessions: z.number().min(1).max(10),
      forceLogoutOnPasswordChange: z.boolean(),
    }).optional(),
    passwordPolicy: z.object({
      minLength: z.number().min(6).max(32),
      requireUppercase: z.boolean(),
      requireLowercase: z.boolean(),
      requireNumbers: z.boolean(),
      requireSpecialChars: z.boolean(),
      passwordExpiry: z.number().min(0).max(365),
    }).optional(),
    ipWhitelisting: z.object({
      enabled: z.boolean(),
      allowedIPs: z.array(z.string()),
      blockUnknownIPs: z.boolean(),
    }).optional(),
    auditLogging: z.object({
      enabled: z.boolean(),
      logLevel: z.enum(['ERROR', 'WARN', 'INFO', 'DEBUG']),
      retentionDays: z.number().min(30).max(2555),
    }).optional(),
    dataEncryption: z.object({
      encryptSensitiveData: z.boolean(),
      encryptionLevel: z.enum(['AES-128', 'AES-256', 'RSA-2048']),
    }).optional(),
    apiSecurity: z.object({
      rateLimitEnabled: z.boolean(),
      maxRequestsPerMinute: z.number().min(10).max(1000),
      requireApiKey: z.boolean(),
    }).optional(),
  }),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 50,
};

/**
 * GET /api/super-admin/schools/[id]/security-settings
 * Get school security settings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get security settings using the service
    const settings = await schoolSecuritySettingsService.getSchoolSecuritySettings((await params).id);
    const recommendations = await schoolSecuritySettingsService.getSecurityRecommendations((await params).id);
    const securityScore = await schoolSecuritySettingsService.getSecurityScore((await params).id);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SCHOOL_SECURITY_SETTINGS',
      resourceId: (await params).id,
    });

    return NextResponse.json({
      schoolId: (await params).id,
      settings,
      recommendations,
      securityScore,
    });
  } catch (error) {
    console.error('Error fetching school security settings:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/super-admin/schools/[id]/security-settings
 * Update school security settings
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = securitySettingsSchema.parse(body);

    // Flatten the nested settings structure
    const flatSettings = {
      // Two-Factor Authentication
      ...(settings.twoFactorAuth && {
        twoFactorEnabled: settings.twoFactorAuth.enabled,
        twoFactorRequired: settings.twoFactorAuth.required,
        twoFactorMethods: settings.twoFactorAuth.methods,
      }),
      // Session Management
      ...(settings.sessionManagement && {
        sessionTimeout: settings.sessionManagement.sessionTimeout,
        maxConcurrentSessions: settings.sessionManagement.maxConcurrentSessions,
        forceLogoutOnPasswordChange: settings.sessionManagement.forceLogoutOnPasswordChange,
      }),
      // Password Policy
      ...(settings.passwordPolicy && {
        passwordMinLength: settings.passwordPolicy.minLength,
        passwordRequireUppercase: settings.passwordPolicy.requireUppercase,
        passwordRequireLowercase: settings.passwordPolicy.requireLowercase,
        passwordRequireNumbers: settings.passwordPolicy.requireNumbers,
        passwordRequireSpecialChars: settings.passwordPolicy.requireSpecialChars,
        passwordExpiry: settings.passwordPolicy.passwordExpiry,
      }),
      // IP Whitelisting
      ...(settings.ipWhitelisting && {
        ipWhitelistEnabled: settings.ipWhitelisting.enabled,
        allowedIPs: settings.ipWhitelisting.allowedIPs,
        blockUnknownIPs: settings.ipWhitelisting.blockUnknownIPs,
      }),
      // Audit Logging
      ...(settings.auditLogging && {
        auditLoggingEnabled: settings.auditLogging.enabled,
        auditLogLevel: settings.auditLogging.logLevel,
        auditLogRetention: settings.auditLogging.retentionDays,
      }),
      // Data Encryption
      ...(settings.dataEncryption && {
        encryptSensitiveData: settings.dataEncryption.encryptSensitiveData,
        encryptionLevel: settings.dataEncryption.encryptionLevel,
      }),
      // API Security
      ...(settings.apiSecurity && {
        rateLimitEnabled: settings.apiSecurity.rateLimitEnabled,
        maxRequestsPerMinute: settings.apiSecurity.maxRequestsPerMinute,
        requireApiKey: settings.apiSecurity.requireApiKey,
      }),
    };

    // Update settings using the service
    const updatedSettings = await schoolSecuritySettingsService.updateSchoolSecuritySettings(
      (await params).id,
      flatSettings,
      session.user.id
    );

    return NextResponse.json({
      message: 'School security settings updated successfully',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating school security settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}