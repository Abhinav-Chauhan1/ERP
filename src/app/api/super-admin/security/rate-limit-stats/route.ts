import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { superAdminAuth } from '@/lib/middleware/super-admin-auth';

/**
 * Get rate limiting statistics
 * Requirements: 14.4, 14.5
 */
export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const authResult = await superAdminAuth(request);
    if (authResult) {
      return authResult; // Return the error response
    }

    const now = new Date();

    // Get statistics
    const [totalBlocked, activeBlocks, expiredBlocks, reasonStats] = await Promise.all([
      // Total blocked identifiers
      db.blockedIdentifier.count(),
      
      // Active blocks
      db.blockedIdentifier.count({
        where: {
          isActive: true,
          expiresAt: { gt: now }
        }
      }),
      
      // Expired blocks
      db.blockedIdentifier.count({
        where: {
          OR: [
            { isActive: false },
            { expiresAt: { lte: now } }
          ]
        }
      }),
      
      // Top reasons for blocking
      db.blockedIdentifier.groupBy({
        by: ['reason'],
        _count: {
          reason: true
        },
        orderBy: {
          _count: {
            reason: 'desc'
          }
        },
        take: 5
      })
    ]);

    const topReasons = reasonStats.map(stat => ({
      reason: stat.reason,
      count: stat._count.reason
    }));

    return NextResponse.json({
      success: true,
      totalBlocked,
      activeBlocks,
      expiredBlocks,
      topReasons
    });

  } catch (error) {
    console.error('Failed to get rate limit stats:', error);
    return NextResponse.json(
      { error: 'Failed to get rate limit stats' },
      { status: 500 }
    );
  }
}