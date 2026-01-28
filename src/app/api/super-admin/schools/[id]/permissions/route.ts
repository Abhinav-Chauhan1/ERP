import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const permissionsSchema = z.object({
  permissions: z.record(z.boolean()),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 100,
};

/**
 * GET /api/super-admin/schools/[id]/permissions
 * Get school permissions
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

    // Get school permissions (this would be from a permissions table or school settings)
    // For now, return default permissions structure
    const defaultPermissions = {
      // Core Features
      'student_management': true,
      'teacher_management': true,
      'parent_management': true,
      'class_management': true,
      'subject_management': true,
      
      // Academic Features
      'syllabus_management': true,
      'assignment_management': true,
      'exam_management': true,
      'report_card_generation': true,
      'attendance_tracking': true,
      
      // Communication Features
      'messaging_system': true,
      'notification_system': true,
      'announcement_system': true,
      'whatsapp_integration': false,
      'sms_integration': false,
      
      // Financial Features
      'fee_management': true,
      'payment_processing': true,
      'financial_reports': true,
      
      // Advanced Features
      'library_management': false,
      'transport_management': false,
      'hostel_management': false,
      'alumni_management': false,
      'certificate_generation': false,
      
      // System Features
      'backup_restore': true,
      'data_export': true,
      'audit_logs': true,
      'api_access': false,
      'custom_branding': true,
    };

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SCHOOL_PERMISSIONS',
      resourceId: params.id,
    });

    return NextResponse.json({
      schoolId: params.id,
      schoolName: school.name,
      permissions: defaultPermissions,
    });
  } catch (error) {
    console.error('Error fetching school permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/super-admin/schools/[id]/permissions
 * Update school permissions
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
    const { permissions } = permissionsSchema.parse(body);

    // Check if school exists
    const school = await db.school.findUnique({
      where: { id: params.id },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // In a real implementation, you would store permissions in a separate table
    // For now, we'll simulate the update
    
    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'SCHOOL_PERMISSIONS',
      resourceId: params.id,
      changes: { permissions },
    });

    return NextResponse.json({
      message: 'School permissions updated successfully',
      permissions,
    });
  } catch (error) {
    console.error('Error updating school permissions:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}