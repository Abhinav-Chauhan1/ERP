/**
 * CDN URL Generation API Route
 * 
 * Provides endpoints for generating school-aware CDN URLs with various options
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { urlManagementService } from '@/lib/services/url-management-service';
import { currentUser } from '@/lib/auth-helpers';

// Request validation schema
const GenerateUrlSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  category: z.string().min(1, 'Category is required'),
  filename: z.string().min(1, 'Filename is required'),
  options: z.object({
    signed: z.boolean().optional(),
    expiresIn: z.number().min(60).max(86400).optional(), // 1 minute to 24 hours
    transform: z.object({
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
      quality: z.number().min(1).max(100).optional(),
      format: z.enum(['webp', 'avif', 'jpeg', 'png']).optional(),
      fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional(),
    }).optional(),
    cacheTTL: z.number().positive().optional(),
    validateFile: z.boolean().optional(),
  }).optional(),
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
    const validatedData = GenerateUrlSchema.parse(body);

    const { schoolId, category, filename, options = {} } = validatedData;

    // Validate user has access to the school
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json(
        { error: 'Access denied: Cannot generate URLs for other schools' },
        { status: 403 }
      );
    }

    // Generate URL using URL management service
    const result = await urlManagementService.generateSchoolUrl(
      schoolId,
      category,
      filename,
      options
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      schoolId,
      category,
      filename,
      options,
    });

  } catch (error) {
    console.error('CDN URL generation error:', error);

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

// Batch URL generation endpoint
const BatchGenerateSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  files: z.array(z.object({
    category: z.string().min(1, 'Category is required'),
    filename: z.string().min(1, 'Filename is required'),
    options: z.object({
      signed: z.boolean().optional(),
      expiresIn: z.number().min(60).max(86400).optional(),
      transform: z.object({
        width: z.number().positive().optional(),
        height: z.number().positive().optional(),
        quality: z.number().min(1).max(100).optional(),
        format: z.enum(['webp', 'avif', 'jpeg', 'png']).optional(),
        fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional(),
      }).optional(),
    }).optional(),
  })).min(1, 'At least one file is required').max(100, 'Maximum 100 files per batch'),
  options: z.object({
    validateFiles: z.boolean().optional(),
    continueOnError: z.boolean().optional(),
  }).optional(),
});

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
    const validatedData = BatchGenerateSchema.parse(body);

    const { schoolId, files, options = {} } = validatedData;

    // Validate user has access to the school
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json(
        { error: 'Access denied: Cannot generate URLs for other schools' },
        { status: 403 }
      );
    }

    // Process batch URL generation
    const result = await urlManagementService.batchGenerateUrls(
      schoolId,
      files,
      options
    );

    return NextResponse.json({
      success: result.success,
      results: result.results,
      summary: {
        totalProcessed: result.totalProcessed,
        successCount: result.successCount,
        errorCount: result.errorCount,
      },
    });

  } catch (error) {
    console.error('Batch CDN URL generation error:', error);

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