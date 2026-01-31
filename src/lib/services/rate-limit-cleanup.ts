import { rateLimitingService } from './rate-limiting-service';
import { rateLimitLogger } from './rate-limit-logger';

/**
 * Rate Limit Cleanup Service
 * Scheduled maintenance for rate limiting data
 * Requirements: 14.5
 */

class RateLimitCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Start automatic cleanup
   */
  startAutomaticCleanup(): void {
    if (this.cleanupInterval) {
      return; // Already running
    }

    console.log('Starting rate limit cleanup service...');
    
    // Run initial cleanup
    this.performCleanup();

    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Stop automatic cleanup
   */
  stopAutomaticCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Stopped rate limit cleanup service');
    }
  }

  /**
   * Perform cleanup manually
   */
  async performCleanup(): Promise<void> {
    try {
      console.log('Starting rate limit data cleanup...');
      
      await rateLimitLogger.logMaintenanceEvent('CLEANUP_STARTED', {
        timestamp: new Date().toISOString()
      });

      // Clean up expired data
      await rateLimitingService.cleanupExpiredData();

      await rateLimitLogger.logMaintenanceEvent('CLEANUP_COMPLETED', {
        timestamp: new Date().toISOString()
      });

      console.log('Rate limit data cleanup completed');

    } catch (error) {
      console.error('Rate limit cleanup failed:', error);
      
      await rateLimitLogger.logMaintenanceEvent('CLEANUP_COMPLETED', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get cleanup status
   */
  getStatus(): {
    isRunning: boolean;
    nextCleanup: Date | null;
    intervalMs: number;
  } {
    return {
      isRunning: this.cleanupInterval !== null,
      nextCleanup: this.cleanupInterval ? 
        new Date(Date.now() + this.CLEANUP_INTERVAL_MS) : null,
      intervalMs: this.CLEANUP_INTERVAL_MS
    };
  }
}

export const rateLimitCleanupService = new RateLimitCleanupService();

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  rateLimitCleanupService.startAutomaticCleanup();
}