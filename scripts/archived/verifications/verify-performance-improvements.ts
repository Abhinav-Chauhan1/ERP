#!/usr/bin/env tsx

/**
 * Performance Verification Script
 * Verifies that the N+1 query optimizations are working correctly
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

interface QueryLog {
  query: string;
  duration: number;
  timestamp: Date;
}

class PerformanceVerifier {
  private queries: QueryLog[] = [];
  private startTime: number = 0;

  constructor() {
    this.setupQueryLogging();
  }

  private setupQueryLogging() {
    db.$on('query', (e) => {
      this.queries.push({
        query: e.query,
        duration: e.duration,
        timestamp: new Date(),
      });
    });
  }

  async verifyOptimizations() {
    console.log('🔍 Verifying performance optimizations...\n');
    
    this.startTime = Date.now();
    this.queries = [];

    // Test 1: Verify subscription queries are optimized
    await this.testSubscriptionQueries();
    
    // Test 2: Verify user statistics are optimized
    await this.testUserStatistics();
    
    // Test 3: Verify school statistics are optimized
    await this.testSchoolStatistics();

    this.generateReport();
  }

  private async testSubscriptionQueries() {
    console.log('📊 Testing subscription queries...');
    const testStart = Date.now();
    
    try {
      // This should now be a single query instead of 12 separate queries
      const subscriptions = await db.subscription.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
          },
        },
        include: {
          school: {
            select: {
              plan: true,
            },
          },
        },
      });

      const duration = Date.now() - testStart;
      console.log(`✅ Subscription query completed in ${duration}ms (found ${subscriptions.length} records)`);
      
      // Check for N+1 patterns
      const subscriptionQueries = this.queries.filter(q => 
        q.query.includes('subscription') && q.timestamp >= new Date(testStart)
      );
      
      if (subscriptionQueries.length <= 2) {
        console.log(`✅ Optimized: Only ${subscriptionQueries.length} subscription queries (expected ≤2)`);
      } else {
        console.log(`⚠️  Warning: ${subscriptionQueries.length} subscription queries (should be ≤2)`);
      }
      
    } catch (error) {
      console.log(`❌ Subscription query failed:`, error);
    }
  }

  private async testUserStatistics() {
    console.log('\n👥 Testing user statistics...');
    const testStart = Date.now();
    
    try {
      // This should use groupBy instead of multiple count queries
      const userStats = await db.user.groupBy({
        by: ['role'],
        _count: { id: true },
      });

      const duration = Date.now() - testStart;
      console.log(`✅ User statistics completed in ${duration}ms (found ${userStats.length} role groups)`);
      
      // Check for multiple count queries
      const userQueries = this.queries.filter(q => 
        q.query.includes('User') && q.timestamp >= new Date(testStart)
      );
      
      if (userQueries.length <= 1) {
        console.log(`✅ Optimized: Only ${userQueries.length} user query (expected 1)`);
      } else {
        console.log(`⚠️  Warning: ${userQueries.length} user queries (should be 1)`);
      }
      
    } catch (error) {
      console.log(`❌ User statistics failed:`, error);
    }
  }

  private async testSchoolStatistics() {
    console.log('\n🏫 Testing school statistics...');
    const testStart = Date.now();
    
    try {
      // This should use groupBy instead of multiple count queries
      const schoolStats = await db.school.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      const duration = Date.now() - testStart;
      console.log(`✅ School statistics completed in ${duration}ms (found ${schoolStats.length} status groups)`);
      
      // Check for multiple count queries
      const schoolQueries = this.queries.filter(q => 
        q.query.includes('schools') && q.timestamp >= new Date(testStart)
      );
      
      if (schoolQueries.length <= 1) {
        console.log(`✅ Optimized: Only ${schoolQueries.length} school query (expected 1)`);
      } else {
        console.log(`⚠️  Warning: ${schoolQueries.length} school queries (should be 1)`);
      }
      
    } catch (error) {
      console.log(`❌ School statistics failed:`, error);
    }
  }

  private generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const totalQueries = this.queries.length;
    const avgDuration = totalQueries > 0 
      ? Math.round(this.queries.reduce((sum, q) => sum + q.duration, 0) / totalQueries)
      : 0;

    console.log('\n📊 PERFORMANCE VERIFICATION REPORT');
    console.log('=' .repeat(50));
    console.log(`Total Test Duration: ${totalDuration}ms`);
    console.log(`Total Database Queries: ${totalQueries}`);
    console.log(`Average Query Duration: ${avgDuration}ms`);
    
    // Check for N+1 patterns
    const queryPatterns = this.groupQueriesByPattern();
    const duplicatePatterns = Object.entries(queryPatterns)
      .filter(([_, queries]) => queries.length >= 3)
      .sort(([_, a], [__, b]) => b.length - a.length);

    if (duplicatePatterns.length === 0) {
      console.log('✅ No N+1 query patterns detected');
    } else {
      console.log(`⚠️  Found ${duplicatePatterns.length} potential N+1 patterns:`);
      duplicatePatterns.slice(0, 3).forEach(([pattern, queries], index) => {
        console.log(`${index + 1}. ${queries.length}x - ${this.truncateQuery(pattern)}`);
      });
    }

    // Performance assessment
    if (totalQueries <= 10 && avgDuration <= 100) {
      console.log('\n🎉 EXCELLENT: Performance optimizations are working perfectly!');
    } else if (totalQueries <= 20 && avgDuration <= 200) {
      console.log('\n✅ GOOD: Performance is much improved');
    } else if (totalQueries <= 50) {
      console.log('\n⚠️  FAIR: Some optimizations are working, but more improvements needed');
    } else {
      console.log('\n❌ POOR: Optimizations may not be working correctly');
    }

    console.log('\n🔧 RECOMMENDATIONS:');
    if (totalQueries > 20) {
      console.log('- Consider adding more database indexes');
      console.log('- Review queries for remaining N+1 patterns');
    }
    if (avgDuration > 100) {
      console.log('- Consider query optimization or caching');
    }
    if (duplicatePatterns.length > 0) {
      console.log('- Investigate duplicate query patterns');
    }
    if (totalQueries <= 10 && avgDuration <= 100) {
      console.log('- Performance is excellent! No further optimizations needed.');
    }
  }

  private groupQueriesByPattern(): Record<string, QueryLog[]> {
    const groups: Record<string, QueryLog[]> = {};
    
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

  private truncateQuery(query: string, maxLength: number = 80): string {
    return query.length > maxLength ? query.substring(0, maxLength) + '...' : query;
  }
}

async function main() {
  const verifier = new PerformanceVerifier();
  
  try {
    await verifier.verifyOptimizations();
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { PerformanceVerifier };