import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
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
    }),
    sessionManagement: z.object({
      sessionTimeout: z.number().min(15).max(1440),
      maxConcurrentSessions: z.number().min(1).max(10),
      forceLogoutOnPasswordChange: z.boolean(),
    }),
    passwordPolicy: z.object({
      minLength: z.number().min(6).max(32),
      requireUppercase: z.boolean(),
      requireLowercase: z.boolean(),
      requireNumbers: z.boolean(),
      requireSpecialChars: z.boolean(),
      passwordExpiry: z.number().min(0).max(365),
    }),
    ipWhitelisting: z.object({
      enabled: z.boolean(),
      allowedIPs: z.array(z.string()),
      blockUnknownIPs: z.boolean(),
    }),
    auditLogging: z.object({
      enabled: z.boolean(),
      logLevel: z.enum(['ERROR', 'WARN', 'INFO', 'DEBUG']),
      retentionDays: z.number().min(30).max(2555),
    }),
    dataEncryption: z.object({
      encryptSensitiveData: z.boolean(),
      encryptionLevel: z.enum(['AES-128', 'AES-256', 'RSA-2048']),
    }),
    apiSecurity: z.object({
      rateLimitEnabled: z.boolean(),
      maxRequestsPerMinute: z.number().min(10).max(1000),
      requireApiKey: z.boolean(),
    }),
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
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if school exists
    const school = await db.school.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // In a real implementation, you would fetch from a security_settings table
    // For now, return default settings
    const defaultSettings = {
      twoFactorAuth: {
        enabled: false,
        required: false,
        methods: ["SMS", "EMAIL"],
      },
      sessionManagement: {
        sessionTimeout: 480, // 8 hours
        maxConcurrentSessions: 3,
        forceLogoutOnPasswordChange: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        passwordExpiry: 90,
      },
      ipWhitelisting: {
        enabled: false,
        allowedIPs: [],
        blockUnknownIPs: false,
      },
      auditLogging: {
        enabled: true,
        logLevel: "INFO" as const,
        retentionDays: 365,
      },
      dataEncryption: {
        encryptSensitiveData: true,
        encryptionLevel: "AES-256" as const,
      },
      apiSecurity: {
        rateLimitEnabled: true,
        maxRequestsPerMinute: 100,
        requireApiKey: false,
      },
    };

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SCHOOL_SECURITY_SETTINGS',
      resourceId: params.id,
    });

    return NextResponse.json({
      schoolId: params.id,
      schoolName: school.name,
      settings: defaultSettings,
    });
  } catch (error) {
    console.error('Error fetching school security settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/super-admin/schools/[id]/security-settings
 * Update school security settings
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Check if school exists
    const school = await db.school.findUnique({
      where: { id: params.id },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Validate IP addresses if IP whitelisting is enabled
    if (settings.ipWhitelisting.enabled && settings.ipWhitelisting.allowedIPs.length > 0) {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const invalidIPs = settings.ipWhitelisting.allowedIPs.filter(ip => !ipRegex.test(ip));
      
      if (invalidIPs.length > 0) {
        return NextResponse.json(
          { error: 'Invalid IP addresses', invalidIPs },
          { status: 400 }
        );
      }
    }

    // In a real implementation, you would store settings in a security_settings table
    // For now, we'll simulate the update
    
    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'SCHOOL_SECURITY_SETTINGS',
      resourceId: params.id,
      changes: { settings },
    });

    return NextResponse.json({
      message: 'School security settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Error updating school security settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}