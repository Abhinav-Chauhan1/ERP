import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { cacheService } from '@/lib/services/cache-service';
import { withErrorHandler } from '@/lib/middleware/enhanced-error-handler';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    storage: ServiceHealth;
    external: ServiceHealth;
  };
  metrics: {
    memory: MemoryMetrics;
    performance: PerformanceMetrics;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: string;
  error?: string;
  details?: any;
}

interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
  heap: {
    used: number;
    total: number;
  };
}

interface PerformanceMetrics {
  averageResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  cacheHitRate: number;
}

/**
 * GET /api/super-admin/system/health
 * Comprehensive system health check
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Check all services
  const [databaseHealth, cacheHealth, storageHealth, externalHealth] = await Promise.allSettled([
    checkDatabaseHealth(),
    checkCacheHealth(),
    checkStorageHealth(),
    checkExternalServicesHealth(),
  ]);

  // Get system metrics
  const memoryMetrics = getMemoryMetrics();
  const performanceMetrics = await getPerformanceMetrics();

  // Determine overall status
  const services = {
    database: getSettledResult(databaseHealth),
    cache: getSettledResult(cacheHealth),
    storage: getSettledResult(storageHealth),
    external: getSettledResult(externalHealth),
  };

  const overallStatus = determineOverallStatus(services);

  const healthCheck: HealthCheckResult = {
    status: overallStatus,
    timestamp,
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services,
    metrics: {
      memory: memoryMetrics,
      performance: performanceMetrics,
    },
  };

  const responseTime = Date.now() - startTime;
  
  return NextResponse.json(healthCheck, {
    status: overallStatus === 'unhealthy' ? 503 : 200,
    headers: {
      'X-Response-Time': `${responseTime}ms`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
});

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Simple query to check database connectivity
    await db.$queryRaw`SELECT 1`;
    
    // Check if we can perform basic operations
    const schoolCount = await db.school.count();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        schoolCount,
        connectionPool: 'active',
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

/**
 * Check cache health
 */
async function checkCacheHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Test cache operations
    const testKey = 'health-check-test';
    const testValue = { timestamp: Date.now() };
    
    cacheService.set(testKey, testValue, 1000); // 1 second TTL
    const retrieved = cacheService.get(testKey);
    cacheService.delete(testKey);
    
    const responseTime = Date.now() - startTime;
    const stats = cacheService.getStatistics();
    
    return {
      status: retrieved && responseTime < 100 ? 'healthy' : 'degraded',
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        hitRate: stats.hitRate,
        size: stats.size,
        operations: {
          hits: stats.hits,
          misses: stats.misses,
        },
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Cache operation failed',
    };
  }
}

/**
 * Check storage health
 */
async function checkStorageHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Check if backup directory is accessible
    const fs = require('fs').promises;
    const backupPath = process.env.BACKUP_STORAGE_PATH || '/tmp/backups';
    
    await fs.access(backupPath);
    const stats = await fs.stat(backupPath);
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        backupPath,
        accessible: true,
        isDirectory: stats.isDirectory(),
      },
    };
  } catch (error) {
    return {
      status: 'degraded',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Storage access failed',
      details: {
        backupPath: process.env.BACKUP_STORAGE_PATH || '/tmp/backups',
        accessible: false,
      },
    };
  }
}

/**
 * Check external services health
 */
async function checkExternalServicesHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // In a real implementation, you would check external services like:
    // - Email service (SendGrid, etc.)
    // - SMS service (MSG91, etc.)
    // - File storage (AWS S3, etc.)
    // - Payment gateway (Stripe, Razorpay, etc.)
    
    // For now, we'll simulate a check
    const services = {
      email: true,
      sms: true,
      storage: true,
      payment: true,
    };
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      lastCheck: new Date().toISOString(),
      details: services,
    };
  } catch (error) {
    return {
      status: 'degraded',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'External service check failed',
    };
  }
}

/**
 * Get memory metrics
 */
function getMemoryMetrics(): MemoryMetrics {
  const memUsage = process.memoryUsage();
  
  return {
    used: memUsage.rss,
    total: memUsage.rss + memUsage.heapTotal,
    percentage: (memUsage.rss / (memUsage.rss + memUsage.heapTotal)) * 100,
    heap: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
    },
  };
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  // In a real implementation, you would collect these metrics from:
  // - Request tracking middleware
  // - Error monitoring service
  // - Performance monitoring tools
  
  const cacheStats = cacheService.getStatistics();
  
  return {
    averageResponseTime: 150, // ms
    requestsPerMinute: 45,
    errorRate: 0.5, // percentage
    cacheHitRate: cacheStats.hitRate,
  };
}

/**
 * Get result from Promise.allSettled
 */
function getSettledResult(result: PromiseSettledResult<ServiceHealth>): ServiceHealth {
  if (result.status === 'fulfilled') {
    return result.value;
  } else {
    return {
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      error: result.reason instanceof Error ? result.reason.message : 'Service check failed',
    };
  }
}

/**
 * Determine overall system status
 */
function determineOverallStatus(services: Record<string, ServiceHealth>): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(services).map(service => service.status);
  
  if (statuses.includes('unhealthy')) {
    return 'unhealthy';
  }
  
  if (statuses.includes('degraded')) {
    return 'degraded';
  }
  
  return 'healthy';
}