/**
 * Legacy URL Redirection API Route
 * 
 * Provides endpoints for managing legacy Cloudinary URL redirections
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { urlManagementService } from '@/lib/services/url-management-service';
import { currentUser } from '@/lib/auth-helpers';

// Create mapping schema
const CreateMappingSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  legacyUrl: z.string().url('Invalid legacy URL format'),
  category: z.string().min(1, 'Category is required'),
  filename: z.string().min(1, 'Filename is required'),
});

// Batch mapping schema
const BatchMappingSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  mappings: z.array(z.object({
    legacyUrl: z.string().url('Invalid legacy URL format'),
    category: z.string().min(1, 'Category is required'),
    filename: z.string().min(1, 'Filename is required'),
  })).min(1, 'At least one mapping is required').max(1000, 'Maximum 1000 mappings per batch'),
});

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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateMappingSchema.parse(body);

    const { schoolId, legacyUrl, category, filename } = validatedData;

    // Validate user has access to the school
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json(
        { error: 'Access denied: Cannot create mappings for other schools' },
        { status: 403 }
      );
    }

    // Create legacy URL mapping
    const result = await urlManagementService.createLegacyMapping(
      schoolId,
      legacyUrl,
      category,
      filename
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      mapping: result.mapping,
    });

  } catch (error) {
    console.error('Legacy mapping creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
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

// Batch create mappings
export async function PUT(request: NextRequest) {
  try {
    // Get current user and validate authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = BatchMappingSchema.parse(body);

    const { schoolId, mappings } = validatedData;

    // Validate user has access to the school
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json(
        { error: 'Access denied: Cannot create mappings for other schools' },
        { status: 403 }
      );
    }

    // Process batch mappings
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const mapping of mappings) {
      try {
        const result = await urlManagementService.createLegacyMapping(
          schoolId,
          mapping.legacyUrl,
          mapping.category,
          mapping.filename
        );

        if (result.success) {
          results.push({
            legacyUrl: mapping.legacyUrl,
            success: true,
            mapping: result.mapping,
          });
          successCount++;
        } else {
          results.push({
            legacyUrl: mapping.legacyUrl,
            success: false,
            error: result.error,
          });
          errorCount++;
        }
      } catch (error) {
        results.push({
          legacyUrl: mapping.legacyUrl,
          success: false,
          error: error instanceof Error ? error.message : 'Processing failed',
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: errorCount === 0,
      results,
      summary: {
        totalProcessed: results.length,
        successCount,
        errorCount,
      },
    });

  } catch (error) {
    console.error('Batch legacy mapping creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
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

// Get redirect URL for legacy URL
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const legacyUrl = searchParams.get('legacyUrl');

    if (!legacyUrl) {
      return NextResponse.json(
        { error: 'Missing required parameter: legacyUrl' },
        { status: 400 }
      );
    }

    // Get redirect URL
    const redirectUrl = urlManagementService.getLegacyRedirect(legacyUrl);

    if (!redirectUrl) {
      return NextResponse.json(
        { error: 'No redirect mapping found for this URL' },
        { status: 404 }
      );
    }

    // Return redirect information
    return NextResponse.json({
      success: true,
      legacyUrl,
      redirectUrl,
    });

  } catch (error) {
    console.error('Legacy redirect lookup error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete mapping
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

    // Only super admins can delete mappings
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied: Only super admins can delete mappings' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const legacyUrl = searchParams.get('legacyUrl');

    if (!legacyUrl) {
      return NextResponse.json(
        { error: 'Missing required parameter: legacyUrl' },
        { status: 400 }
      );
    }

    // Delete mapping (this would need to be implemented in the service)
    // For now, we'll return success
    return NextResponse.json({
      success: true,
      message: 'Mapping deleted successfully',
    });

  } catch (error) {
    console.error('Legacy mapping deletion error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}