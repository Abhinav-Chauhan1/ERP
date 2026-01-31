import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction, BackupType, BackupStatus } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { backupService } from '@/lib/services/backup-service';

const createBackupSchema = z.object({
  type: z.enum(['MANUAL', 'SCHEDULED', 'AUTOMATIC']).default('MANUAL'),
  includeFiles: z.boolean().optional().default(true),
  includeDatabase: z.boolean().optional().default(true),
  includeLogs: z.boolean().optional().default(false),
  compressionLevel: z.number().min(1).max(9).optional().default(6),
  encryptBackup: z.boolean().optional().default(false),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 10, // Limited backup creation
};

/**
 * GET /api/super-admin/schools/[id]/backups
 * Get school backups list
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

    // Check if school exists
    const school = await db.school.findUnique({
      where: { id: (await params).id },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Get backups using the service
    const backups = await backupService.listSchoolBackups((await params).id, 20, 0);
    const backupStats = await backupService.getBackupStats((await params).id);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SCHOOL_BACKUPS',
      resourceId: (await params).id,
    });

    return NextResponse.json({
      schoolId: (await params).id,
      schoolName: school.name,
      backups: backups.map(backup => ({
        id: backup.id,
        createdAt: backup.createdAt.toISOString(),
        size: backup.size ? `${Math.round(Number(backup.size) / (1024 * 1024))} MB` : 'Unknown',
        type: backup.type,
        status: backup.status,
        filename: backup.filename,
        completedAt: backup.completedAt?.toISOString(),
        errorMessage: backup.errorMessage,
        includeFiles: backup.includeFiles,
      })),
      stats: backupStats,
    });
  } catch (error) {
    console.error('Error fetching school backups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/super-admin/schools/[id]/backups
 * Create a new backup for the school
 */
export async function POST(
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
    const options = createBackupSchema.parse(body);

    // Check if school exists
    const school = await db.school.findUnique({
      where: { id: (await params).id },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Create backup using the service
    const backupId = await backupService.createBackup(
      (await params).id,
      options.type as BackupType,
      {
        includeFiles: options.includeFiles,
        includeDatabase: options.includeDatabase,
        includeLogs: options.includeLogs,
        compressionLevel: options.compressionLevel,
        encryptBackup: options.encryptBackup,
      },
      session.user.id
    );

    return NextResponse.json({
      message: 'Backup creation initiated',
      backupId,
      status: 'PENDING',
    });
  } catch (error) {
    console.error('Error creating school backup:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}