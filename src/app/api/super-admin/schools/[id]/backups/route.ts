import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const createBackupSchema = z.object({
  type: z.enum(['MANUAL', 'SCHEDULED']),
  includeFiles: z.boolean().optional().default(true),
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

    // Get backups from database
    const backups = await db.backup.findMany({
      where: { schoolId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to recent backups
      select: {
        id: true,
        filename: true,
        size: true,
        type: true,
        status: true,
        createdAt: true,
        completedAt: true,
        errorMessage: true,
      }
    });

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SCHOOL_BACKUPS',
      resourceId: params.id,
    });

    return NextResponse.json({
      schoolId: params.id,
      schoolName: school.name,
      backups: backups.map(backup => ({
        id: backup.id,
        createdAt: backup.createdAt.toISOString(),
        size: backup.size ? `${Math.round(backup.size / (1024 * 1024))} MB` : 'Unknown',
        type: backup.type,
        status: backup.status,
        filename: backup.filename,
        completedAt: backup.completedAt?.toISOString(),
        errorMessage: backup.errorMessage,
      })),
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
    const { type, includeFiles } = createBackupSchema.parse(body);

    // Check if school exists
    const school = await db.school.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Check for existing pending backups
    const pendingBackup = await db.backup.findFirst({
      where: {
        schoolId: params.id,
        status: 'PENDING',
      },
    });

    if (pendingBackup) {
      return NextResponse.json(
        { error: 'A backup is already in progress' },
        { status: 409 }
      );
    }

    // Create backup record
    const backup = await db.backup.create({
      data: {
        schoolId: params.id,
        filename: `school-${params.id}-${Date.now()}.zip`,
        type: type,
        status: 'PENDING',
        includeFiles: includeFiles,
        createdBy: session.user.id,
      },
    });

    // In a real implementation, you would trigger the actual backup process here
    // This could be a background job, queue system, or external service
    
    // For demonstration, we'll simulate the backup process
    setTimeout(async () => {
      try {
        // Simulate backup completion
        await db.backup.update({
          where: { id: backup.id },
          data: {
            status: 'COMPLETED',
            size: Math.floor(Math.random() * 500000000) + 100000000, // Random size between 100MB-600MB
            completedAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Error completing backup:', error);
        await db.backup.update({
          where: { id: backup.id },
          data: {
            status: 'FAILED',
            errorMessage: 'Backup process failed',
            completedAt: new Date(),
          },
        });
      }
    }, 5000); // Simulate 5 second backup process

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.CREATE,
      resource: 'SCHOOL_BACKUP',
      resourceId: backup.id,
      changes: { schoolId: params.id, type, includeFiles },
    });

    return NextResponse.json({
      message: 'Backup creation initiated',
      backup: {
        id: backup.id,
        filename: backup.filename,
        type: backup.type,
        status: backup.status,
        createdAt: backup.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating school backup:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}