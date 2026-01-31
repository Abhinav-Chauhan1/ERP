#!/usr/bin/env tsx

/**
 * Query Performance Monitor
 * Monitors and reports on database query performance issues
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any[];
}

class QueryPerformanceMonitor {
  private queries: QueryMetrics[] = [];
  private slowQueryThreshold = 1000; // 1 second
  private duplicateQueryThreshold = 5; // 5 identical queries
  
  constructor() {
    this.setupQueryLogging();
  }

  private setupQueryLogging() {
    db.$on('query', (e) => {
      this.queries.push({
        query: e.query,
        duration: e.duration,
        timestamp: new Date(),
        params: e.params ? JSON.parse(e.params) : undefined,
      });
    });
  }

  public startMonitoring(durationMs: number = 30000) {
    console.log(`🔍 Starting query performance monitoring for ${durationMs/1000} seconds...`);
    
    setTimeout(() => {
      this.generateReport();
      process.exit(0);
    }, durationMs);
  }

  private generateReport() {
    console.log('\n📊 QUERY PERFORMANCE REPORT');
    console.log('=' .repeat(50));
    
    this.reportSlowQueries();
    this.reportDuplicateQueries();
    this.reportQueryStats();
    this.reportN1Issues();
  }

  private reportSlowQueries() {
    const slowQueries = this.queries.filter(q => q.duration > this.slowQueryThreshold);
    
    console.log(`\n🐌 SLOW QUERIES (>${this.slowQueryThreshold}ms):`);
    console.log(`Found ${slowQueries.length} slow queries`);
    
    slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .forEach((query, index) => {
        console.log(`${index + 1}. ${query.duration}ms - ${this.truncateQuery(query.query)}`);
      });
  }

  private reportDuplicateQueries() {
    const queryGroups = this.groupQueriesByPattern();
    const duplicates = Object.entries(queryGroups)
      .filter(([_, queries]) => queries.length >= this.duplicateQueryThreshold)
      .sort(([_, a], [__, b]) => b.length - a.length);

    console.log(`\n🔄 DUPLICATE QUERIES (>=${this.duplicateQueryThreshold} occurrences):`);
    console.log(`Found ${duplicates.length} query patterns with excessive repetition`);
    
    duplicates.slice(0, 10).forEach(([pattern, queries], index) => {
      console.log(`${index + 1}. ${queries.length}x - ${this.truncateQuery(pattern)}`);
      console.log(`   Avg duration: ${Math.round(queries.reduce((sum, q) => sum + q.duration, 0) / queries.length)}ms`);
    });
  }

  private reportQueryStats() {
    const totalQueries = this.queries.length;
    const totalDuration = this.queries.reduce((sum, q) => sum + q.duration, 0);
    const avgDuration = totalQueries > 0 ? Math.round(totalDuration / totalQueries) : 0;
    
    console.log(`\n📈 QUERY STATISTICS:`);
    console.log(`Total queries: ${totalQueries}`);
    console.log(`Total duration: ${totalDuration}ms`);
    console.log(`Average duration: ${avgDuration}ms`);
    console.log(`Queries per second: ${Math.round(totalQueries / 30)}`);
  }

  private reportN1Issues() {
    const n1Patterns = this.detectN1Patterns();
    
    console.log(`\n⚠️  POTENTIAL N+1 ISSUES:`);
    console.log(`Found ${n1Patterns.length} potential N+1 patterns`);
    
    n1Patterns.forEach((pattern, index) => {
      console.log(`${index + 1}. ${pattern.count}x similar queries in ${pattern.timeWindow}ms window`);
      console.log(`   Pattern: ${this.truncateQuery(pattern.query)}`);
    });
  }

  private groupQueriesByPattern(): Record<string, QueryMetrics[]> {
    const groups: Record<string, QueryMetrics[]> = {};
    
    this.queries.forEach(query => {
      // Normalize query by removing parameter values
      const pattern = query.query.replace(/\$\d+/g, '$?').replace(/\s+/g, ' ').trim();
      
      if (!groups[pattern]) {
        groups[pattern] = [];
      }
      groups[pattern].push(query);
    });
    
    return groups;
  }

  private detectN1Patterns(): Array<{query: string, count: number, timeWindow: number}> {
    const patterns: Array<{query: string, count: number, timeWindow: number}> = [];
    const queryGroups = this.groupQueriesByPattern();
    
    Object.entries(queryGroups).forEach(([pattern, queries]) => {
      if (queries.length >= 5) {
        // Check if queries happened in quick succession (potential N+1)
        const sortedQueries = queries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const firstQuery = sortedQueries[0];
        const lastQuery = sortedQueries[sortedQueries.length - 1];
        const timeWindow = lastQuery.timestamp.getTime() - firstQuery.timestamp.getTime();
        
        // If many similar queries happened within 5 seconds, it's likely N+1
        if (timeWindow < 5000 && queries.length >= 5) {
          patterns.push({
            query: pattern,
            count: queries.length,
            timeWindow
          });
        }
      }
    });
    
    return patterns.sort((a, b) => b.count - a.count);
  }

  private truncateQuery(query: string, maxLength: number = 100): string {
    return query.length > maxLength ? query.substring(0, maxLength) + '...' : query;
  }
}

// Test the dashboard endpoint that was causing issues
async function testDashboardPerformance() {
  console.log('🧪 Testing dashboard performance...');
  
  const monitor = new QueryPerformanceMonitor();
  
  // Simulate dashboard load
  try {
    const { getDashboardAnalytics } = await import('../src/lib/actions/analytics-actions');
    
    console.log('Loading dashboard analytics...');
    const start = Date.now();
    
    const result = await getDashboardAnalytics('30d');
    
    const duration = Date.now() - start;
    console.log(`Dashboard loaded in ${duration}ms`);
    
    if (result.success) {
      console.log('✅ Dashboard analytics loaded successfully');
    } else {
      console.log('❌ Dashboard analytics failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing dashboard:', error);
  }
  
  // Generate report after 5 seconds
  setTimeout(() => {
    monitor.generateReport();
    process.exit(0);
  }, 5000);
}

if (require.main === module) {
  testDashboardPerformance();
}

export { QueryPerformanceMonitor };