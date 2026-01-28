import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supportService } from '@/lib/services/support-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const createTicketSchema = z.object({
  schoolId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 100,
};

/**
 * GET /api/super-admin/support/tickets
 * Get support tickets with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      schoolId: searchParams.get('schoolId') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      category: searchParams.get('category') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      search: searchParams.get('search') || undefined,
    };

    const tickets = await supportService.getTickets(filters);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SUPPORT_TICKET',
      metadata: {
        filters,
        resultCount: tickets.tickets.length,
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/super-admin/support/tickets
 * Create a new support ticket
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTicketSchema.parse(body);

    const ticket = await supportService.createTicket({
      ...validatedData,
      createdBy: session.user.id,
    });

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.CREATE,
      resource: 'SUPPORT_TICKET',
      resourceId: ticket.id,
      changes: validatedData,
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}