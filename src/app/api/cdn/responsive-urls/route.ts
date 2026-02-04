/**
 * Responsive URLs Generation API Route
 * 
 * Provides endpoints for generating device-optimized URLs
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { urlManagementService } from '@/lib/services/url-management-service';
import { currentUser } from '@/lib/auth-helpers';

// Request validation schema
const ResponsiveUrlSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  category: z.string().min(1, 'Category is required'),
  filename: z.string().min(1, 'Filename is required'),
  supportedFormats: z.array(z.enum(['webp', 'avif', 'jpeg', 'png'])).default(['webp', 'jpeg']),
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
    const validatedData = ResponsiveUrlSchema.parse(body);

    const { schoolId, category, filename, supportedFormats } = validatedData;

    // Validate user has access to the school
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json(
        { error: 'Access denied: Cannot generate URLs for other schools' },
        { status: 403 }
      );
    }

    // Generate responsive URLs
    const urls = await urlManagementService.generateResponsiveUrls(
      schoolId,
      category,
      filename,
      supportedFormats
    );

    return NextResponse.json({
      success: true,
      urls,
      schoolId,
      category,
      filename,
      supportedFormats,
    });

  } catch (error) {
    console.error('Responsive URLs generation error:', error);

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

// Get client capabilities and generate appropriate URLs
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
    const category = searchParams.get('category');
    const filename = searchParams.get('filename');
    const userAgent = request.headers.get('user-agent') || '';
    const acceptHeader = request.headers.get('accept') || '';

    if (!schoolId || !category || !filename) {
      return NextResponse.json(
        { error: 'Missing required parameters: schoolId, category, filename' },
        { status: 400 }
      );
    }

    // Validate user has access to the school
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json(
        { error: 'Access denied: Cannot generate URLs for other schools' },
        { status: 403 }
      );
    }

    // Detect client capabilities
    const supportedFormats = detectSupportedFormats(acceptHeader, userAgent);
    const deviceType = detectDeviceType(userAgent);

    // Generate responsive URLs
    const urls = await urlManagementService.generateResponsiveUrls(
      schoolId,
      category,
      filename,
      supportedFormats
    );

    // Return the most appropriate URL based on device type
    const recommendedUrl = urls[deviceType as keyof typeof urls] || urls.desktop;

    return NextResponse.json({
      success: true,
      recommendedUrl,
      allUrls: urls,
      clientInfo: {
        deviceType,
        supportedFormats,
        userAgent: userAgent.substring(0, 100), // Truncate for privacy
      },
      schoolId,
      category,
      filename,
    });

  } catch (error) {
    console.error('Client-aware URL generation error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Detect supported image formats from Accept header and User-Agent
 */
function detectSupportedFormats(acceptHeader: string, userAgent: string): string[] {
  const formats: string[] = ['jpeg']; // Always support JPEG as fallback

  // Check Accept header for image format support
  if (acceptHeader.includes('image/webp')) {
    formats.unshift('webp');
  }

  if (acceptHeader.includes('image/avif')) {
    formats.unshift('avif');
  }

  // Check User-Agent for browser-specific support
  const ua = userAgent.toLowerCase();

  // WebP support detection
  if (!formats.includes('webp')) {
    if (
      ua.includes('chrome') ||
      ua.includes('firefox') ||
      ua.includes('edge') ||
      ua.includes('opera')
    ) {
      formats.unshift('webp');
    }
  }

  // AVIF support detection (newer browsers)
  if (!formats.includes('avif')) {
    if (
      (ua.includes('chrome') && extractVersion(ua, 'chrome') >= 85) ||
      (ua.includes('firefox') && extractVersion(ua, 'firefox') >= 93) ||
      (ua.includes('edge') && extractVersion(ua, 'edge') >= 85)
    ) {
      formats.unshift('avif');
    }
  }

  return formats;
}

/**
 * Detect device type from User-Agent
 */
function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase();

  // Mobile detection
  if (
    ua.includes('mobile') ||
    ua.includes('android') ||
    ua.includes('iphone') ||
    ua.includes('ipod') ||
    ua.includes('blackberry') ||
    ua.includes('windows phone')
  ) {
    return 'mobile';
  }

  // Tablet detection
  if (
    ua.includes('tablet') ||
    ua.includes('ipad') ||
    (ua.includes('android') && !ua.includes('mobile'))
  ) {
    return 'tablet';
  }

  return 'desktop';
}

/**
 * Extract version number from User-Agent string
 */
function extractVersion(userAgent: string, browser: string): number {
  const regex = new RegExp(`${browser}[/\\s]([\\d.]+)`, 'i');
  const match = userAgent.match(regex);
  
  if (match && match[1]) {
    const version = parseFloat(match[1]);
    return isNaN(version) ? 0 : version;
  }
  
  return 0;
}