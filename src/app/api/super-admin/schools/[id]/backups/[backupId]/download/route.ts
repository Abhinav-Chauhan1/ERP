import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { rateLimit } from '@/lib/middleware/rate-limit';

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
  { params }: { params: { id: string; backupId: string } }
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

    // Check if backup exists and belongs to the school
    const backup = await db.backup.findFirst({
      where: {
        id: params.backupId,
        schoolId: params.id,
        status: 'COMPLETED',
      },
    });

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found or not completed' }, { status: 404 });
    }

    // In a real implementation, you would:
    // 1. Check if the backup file exists in storage (S3, local filesystem, etc.)
    // 2. Stream the file to the client
    // 3. Handle large file downloads with proper streaming
    
    // For demonstration, we'll create a mock zip file response
    const mockZipContent = Buffer.from('PK\x03\x04\x14\x00\x00\x00\x08\x00'); // ZIP file header
    
    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SCHOOL_BACKUP_DOWNLOAD',
      resourceId: params.backupId,
      changes: { schoolId: params.id, filename: backup.filename },
    });

    // Return the file as a download
    return new NextResponse(mockZipContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${backup.filename}"`,
        'Content-Length': mockZipContent.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading backup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}