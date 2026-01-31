import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { backupService } from '@/lib/services/backup-service';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 5, // Limited downloads
};

/**
 * GET /api/super-admin/schools/[id]/backups/[backupId]/download
 * Download a specific backup file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; backupId: string }> }
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

    // Check if backup exists and belongs to the school
    const backup = await db.backup.findFirst({
      where: {
        id: (await params).backupId,
        schoolId: (await params).id,
        status: 'COMPLETED',
      },
    });

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found or not completed' }, { status: 404 });
    }

    try {
      // Get backup file path using the service
      const backupFilePath = await backupService.getBackupDownloadPath((await params).backupId);
      
      // Get file stats
      const fileStats = await stat(backupFilePath);
      
      // Create read stream for the file
      const fileStream = createReadStream(backupFilePath);
      
      // Log audit event
      await logAuditEvent({
        userId: session.user.id,
        action: AuditAction.READ,
        resource: 'SCHOOL_BACKUP_DOWNLOAD',
        resourceId: (await params).backupId,
        changes: { schoolId: (await params).id, filename: backup.filename, size: fileStats.size },
      });

      // Return the file as a streaming download
      return new NextResponse(fileStream as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${backup.filename}"`,
          'Content-Length': fileStats.size.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch (serviceError) {
      console.error('Error accessing backup file:', serviceError);
      return NextResponse.json({ 
        error: serviceError instanceof Error ? serviceError.message : 'Backup file not accessible' 
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error downloading backup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}