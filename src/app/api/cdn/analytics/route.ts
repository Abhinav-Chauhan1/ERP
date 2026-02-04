/**
 * CDN Analytics API Route
 * 
 * Provides endpoints for CDN usage analytics and URL statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { urlManagementService } from '@/lib/services/url-management-service';
import { currentUser } from '@/lib/auth-helpers';

// Analytics query schema
const AnalyticsQuerySchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  timeRange: z.enum(['24h', '7d', '30d', '90d']).optional().default('30d'),
  category: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Get current user and validate authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const timeRange = searchParams.get('timeRange') || '30d';
    const category = searchParams.get('category');

    // Validate parameters
    const validatedData = AnalyticsQuerySchema.parse({
      schoolId,
      timeRange,
      category,
    });

    // Validate user has access to the school
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== validatedData.schoolId) {
      return NextResponse.json(
        { error: 'Access denied: Cannot view analytics for other schools' },
        { status: 403 }
      );
    }

    // Get URL analytics
    const analytics = urlManagementService.getUrlAnalytics(validatedData.schoolId);

    // Filter by category if specified
    let filteredAnalytics = analytics;
    if (validatedData.category) {
      const categoryCount = analytics.categoryBreakdown[validatedData.category] || 0;
      filteredAnalytics = {
        ...analytics,
        totalUrls: categoryCount,
        categoryBreakdown: { [validatedData.category]: categoryCount },
      };
    }

    return NextResponse.json({
      success: true,
      analytics: filteredAnalytics,
      timeRange: validatedData.timeRange,
      category: validatedData.category,
    });

  } catch (error) {
    console.error('CDN analytics error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export URL mappings
export async function POST(request: NextRequest) {
  try {
    // Get current user and validate authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { schoolId, format = 'json' } = body;

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    // Validate user has access to the school
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json(
        { error: 'Access denied: Cannot export data for other schools' },
        { status: 403 }
      );
    }

    // Export mappings
    const mappings = urlManagementService.exportMappings(schoolId);

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeader = 'Legacy URL,New URL,Category,Filename,Created At,Access Count,Last Accessed\n';
      const csvRows = mappings.map(mapping => 
        `"${mapping.legacyUrl}","${mapping.newUrl}","${mapping.category}","${mapping.filename}","${mapping.createdAt.toISOString()}",${mapping.accessCount},"${mapping.lastAccessed?.toISOString() || ''}"`
      ).join('\n');
      
      const csvContent = csvHeader + csvRows;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="url-mappings-${schoolId}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Return JSON format
    return NextResponse.json({
      success: true,
      mappings,
      exportedAt: new Date().toISOString(),
      schoolId,
      totalMappings: mappings.length,
    });

  } catch (error) {
    console.error('URL mappings export error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Cleanup expired mappings
export async function DELETE(request: NextRequest) {
  try {
    // Get current user and validate authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only super admins can cleanup mappings
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied: Only super admins can cleanup mappings' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const maxAge = parseInt(searchParams.get('maxAge') || '30');

    if (maxAge < 1 || maxAge > 365) {
      return NextResponse.json(
        { error: 'Max age must be between 1 and 365 days' },
        { status: 400 }
      );
    }

    // Cleanup expired mappings
    const cleanedCount = urlManagementService.cleanupExpiredMappings(maxAge);

    return NextResponse.json({
      success: true,
      cleanedCount,
      maxAge,
      cleanedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Mapping cleanup error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}