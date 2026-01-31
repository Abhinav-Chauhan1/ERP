import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supportService } from '@/lib/services/support-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const createArticleSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().default(false),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 100,
};

/**
 * GET /api/super-admin/support/knowledge-base
 * Get knowledge base articles
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
      category: searchParams.get('category') || undefined,
      isPublished: searchParams.get('isPublished') === 'true' ? true : 
                   searchParams.get('isPublished') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await supportService.getKnowledgeBaseArticles(filters);

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'KNOWLEDGE_BASE',
      metadata: {
        filters,
        resultCount: result.articles.length,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching knowledge base articles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/super-admin/support/knowledge-base
 * Create a new knowledge base article
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
    const validatedData = createArticleSchema.parse(body);

    const article = await supportService.createKnowledgeBaseArticle({
      ...validatedData,
      authorId: session.user.id,
      tags: validatedData.tags || [],
    });

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.CREATE,
      resource: 'KNOWLEDGE_BASE',
      resourceId: article.id,
      changes: validatedData,
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge base article:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}