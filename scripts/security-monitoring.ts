#!/usr/bin/env tsx

/**
 * Security Monitoring Script
 * Monitors for potential security issues and N+1 queries in real-time
 */

import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

interface QueryMetrics {
  query: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  lastSeen: Date;
}

interface SecurityAlert {
  type: 'N_PLUS_ONE' | 'SLOW_QUERY' | 'REPEATED_QUERY' | 'SUSPICIOUS_PATTERN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  query?: string;
  metrics?: QueryMetrics;
  timestamp: Date;
}

class SecurityMonitor {
  private queryMetrics = new Map<string, QueryMetrics>();
  private alerts: SecurityAlert[] = [];
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private readonly REPEATED_QUERY_THRESHOLD = 10; // 10 times in 5 minutes
  private readonly N_PLUS_ONE_PATTERNS = [
    /SELECT.*FROM.*WHERE.*IN.*\$\d+/i,
    /SELECT.*FROM.*WHERE.*=.*\$\d+.*LIMIT.*1/i,
  ];

  constructor() {
    this.setupPrismaLogging();
    this.startPeriodicAnalysis();
  }

  private setupPrismaLogging() {
    prisma.$on('query', (e) => {
      this.analyzeQuery(e.query, e.duration);
    });

    prisma.$on('error', (e) => {
      this.createAlert({
        type: 'SUSPICIOUS_PATTERN',
        severity: 'HIGH',
        message: `Database error: ${e.message}`,
        timestamp: new Date(),
      });
    });
  }

  private analyzeQuery(query: string, duration: number) {
    const normalizedQuery = this.normalizeQuery(query);
    
    // Update metrics
    const existing = this.queryMetrics.get(normalizedQuery);
    if (existing) {
      existing.count++;
      existing.totalDuration += duration;
      existing.avgDuration = existing.totalDuration / existing.count;
      existing.lastSeen = new Date();
    } else {
      this.queryMetrics.set(normalizedQuery, {
        query: normalizedQuery,
        count: 1,
        totalDuration: duration,
        avgDuration: duration,
        lastSeen: new Date(),
      });
    }

    const metrics = this.queryMetrics.get(normalizedQuery)!;

    // Check for slow queries
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      this.createAlert({
        type: 'SLOW_QUERY',
        severity: duration > 5000 ? 'CRITICAL' : 'HIGH',
        message: `Slow query detected: ${duration}ms`,
        query: normalizedQuery,
        metrics,
        timestamp: new Date(),
      });
    }

    // Check for repeated queries (potential N+1)
    if (metrics.count > this.REPEATED_QUERY_THRESHOLD) {
      const timeSinceFirst = Date.now() - (metrics.lastSeen.getTime() - (metrics.count * 1000));
      if (timeSinceFirst < 5 * 60 * 1000) { // 5 minutes
        this.createAlert({
          type: 'REPEATED_QUERY',
          severity: 'HIGH',
          message: `Query repeated ${metrics.count} times in 5 minutes`,
          query: normalizedQuery,
          metrics,
          timestamp: new Date(),
        });
      }
    }

    // Check for N+1 patterns
    if (this.isNPlusOnePattern(normalizedQuery)) {
      this.createAlert({
        type: 'N_PLUS_ONE',
        severity: 'CRITICAL',
        message: 'Potential N+1 query pattern detected',
        query: normalizedQuery,
        metrics,
        timestamp: new Date(),
      });
    }
  }

  private normalizeQuery(query: string): string {
    // Replace parameter placeholders with generic markers
    return query
      .replace(/\$\d+/g, '$?')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isNPlusOnePattern(query: string): boolean {
    return this.N_PLUS_ONE_PATTERNS.some(pattern => pattern.test(query));
  }

  private createAlert(alert: SecurityAlert) {
    this.alerts.push(alert);
    
    // Log immediately for critical alerts
    if (alert.severity === 'CRITICAL') {
      console.error('🚨 CRITICAL SECURITY ALERT:', alert);
    } else if (alert.severity === 'HIGH') {
      console.warn('⚠️  HIGH SECURITY ALERT:', alert);
    }

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  private startPeriodicAnalysis() {
    setInterval(() => {
      this.analyzePatterns();
      this.cleanupOldMetrics();
    }, 60000); // Every minute
  }

  private analyzePatterns() {
    const now = new Date();
    const recentAlerts = this.alerts.filter(
      alert => now.getTime() - alert.timestamp.getTime() < 5 * 60 * 1000
    );

    // Check for alert patterns
    const alertCounts = recentAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Alert if too many security issues
    if (alertCounts.N_PLUS_ONE > 5) {
      console.error('🚨 MULTIPLE N+1 QUERIES DETECTED - IMMEDIATE ACTION REQUIRED');
    }

    if (alertCounts.SLOW_QUERY > 10) {
      console.warn('⚠️  MULTIPLE SLOW QUERIES DETECTED - PERFORMANCE DEGRADATION');
    }

    // Report top slow queries
    const slowQueries = Array.from(this.queryMetrics.values())
      .filter(m => m.avgDuration > 500)
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    if (slowQueries.length > 0) {
      console.log('\n📊 TOP SLOW QUERIES:');
      slowQueries.forEach((query, index) => {
        console.log(`${index + 1}. ${query.avgDuration.toFixed(2)}ms avg (${query.count} times): ${query.query.substring(0, 100)}...`);
      });
    }

    // Report most frequent queries
    const frequentQueries = Array.from(this.queryMetrics.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (frequentQueries.length > 0) {
      console.log('\n📈 MOST FREQUENT QUERIES:');
      frequentQueries.forEach((query, index) => {
        console.log(`${index + 1}. ${query.count} times (${query.avgDuration.toFixed(2)}ms avg): ${query.query.substring(0, 100)}...`);
      });
    }
  }

  private cleanupOldMetrics() {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    
    for (const [key, metrics] of this.queryMetrics.entries()) {
      if (metrics.lastSeen < cutoff) {
        this.queryMetrics.delete(key);
      }
    }
  }

  public getReport() {
    return {
      totalQueries: Array.from(this.queryMetrics.values()).reduce((sum, m) => sum + m.count, 0),
      uniqueQueries: this.queryMetrics.size,
      alerts: this.alerts.length,
      recentAlerts: this.alerts.filter(a => Date.now() - a.timestamp.getTime() < 5 * 60 * 1000).length,
      topSlowQueries: Array.from(this.queryMetrics.values())
        .sort((a, b) => b.avgDuration - a.avgDuration)
        .slice(0, 10),
      topFrequentQueries: Array.from(this.queryMetrics.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  }
}

// Specific monitoring for scheduled reports issue
async function monitorScheduledReports() {
  try {
    const start = performance.now();
    
    const dueReports = await prisma.scheduledReport.findMany({
      where: {
        active: true,
        nextRunAt: {
          lte: new Date(),
        },
      },
    });
    
    const duration = performance.now() - start;
    
    if (duration > 100) {
      console.warn(`⚠️  Slow scheduled reports query: ${duration.toFixed(2)}ms`);
    }

    if (dueReports.length === 0) {
      console.log(`ℹ️  No scheduled reports due (query took ${duration.toFixed(2)}ms)`);
    } else {
      console.log(`📋 Found ${dueReports.length} due scheduled reports (query took ${duration.toFixed(2)}ms)`);
    }
  } catch (error) {
    console.error('❌ Error monitoring scheduled reports:', error);
  }
}

// Initialize monitoring
console.log('🔍 Starting Security Monitor...');
const monitor = new SecurityMonitor();

// Monitor scheduled reports specifically
setInterval(monitorScheduledReports, 30000); // Every 30 seconds

// Report summary every 5 minutes
setInterval(() => {
  const report = monitor.getReport();
  console.log('\n📊 SECURITY MONITORING SUMMARY:');
  console.log(`   Total Queries: ${report.totalQueries}`);
  console.log(`   Unique Queries: ${report.uniqueQueries}`);
  console.log(`   Total Alerts: ${report.alerts}`);
  console.log(`   Recent Alerts: ${report.recentAlerts}`);
  console.log('');
}, 5 * 60 * 1000);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Security Monitor...');
  await prisma.$disconnect();
  process.exit(0);
});

console.log('✅ Security Monitor started successfully');
console.log('   - Monitoring for N+1 queries');
console.log('   - Monitoring for slow queries (>1s)');
console.log('   - Monitoring for repeated queries');
console.log('   - Monitoring scheduled reports polling');
console.log('   - Press Ctrl+C to stop');