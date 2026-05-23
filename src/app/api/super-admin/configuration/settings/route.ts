import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { configurationService } from '@/lib/services/configuration-service';
import { logAuditEvent } from '@/lib/services/audit-service';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '@/lib/middleware/rate-limit';

const updateSettingsSchema = z.object({
  category: z.string().min(1),
  settings: z.record(z.any()),
});

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 50, // Restrictive for configuration changes
};

/**
 * GET /api/super-admin/configuration/settings
 * Get system configuration settings
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
    const category = searchParams.get('category');

    const settings = await configurationService.getConfigurations({ category: category || undefined });

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.READ,
      resource: 'SYSTEM_CONFIG',
      metadata: {
        category: category || 'all',
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/super-admin/configuration/settings
 * Update system configuration settings
 */
export async function PUT(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, rateLimitConfig);
    if (rateLimitResult) return rateLimitResult;

    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    // OPTIMIZED: Batch configuration updates instead of sequential updates
    const settingsEntries = Object.entries(validatedData.settings);
    
    if (settingsEntries.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No settings to update',
        updatedSettings: [] 
      });
    }

    // Process settings in parallel with controlled concurrency
    const BATCH_SIZE = 5; // Process 5 settings concurrently
    const updatedSettings: any[] = [];
    
    for (let i = 0; i < settingsEntries.length; i += BATCH_SIZE) {
      const batch = settingsEntries.slice(i, i + BATCH_SIZE);
      
      // Process batch in parallel
      const batchPromises = batch.map(async ([key, value]) => {
        try {
          return await configurationService.setConfiguration(
            session.user.id,
            {
              key,
              value,
              category: validatedData.category as any,
              description: `Setting for ${key}`
            }
          );
        } catch (error) {
          console.error(`Failed to update setting ${key}:`, error);
          throw new Error(`Failed to update setting ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
      
      // Wait for batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results and collect successful updates
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          updatedSettings.push(result.value);
        } else {
          const [key] = batch[index];
          console.error(`Failed to update setting ${key}:`, result.reason);
          // Continue processing other settings instead of failing completely
        }
      });
    }

    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      resource: 'SYSTEM_CONFIG',
      resourceId: validatedData.category,
      changes: validatedData.settings,
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}