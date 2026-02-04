#!/usr/bin/env tsx

/**
 * N+1 Query Detection and Monitoring Script
 * Analyzes Prisma query logs to detect potential N+1 query patterns
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

interface QueryPattern {
  query: string;
  count: number;
  duration: number;
  timestamps: Date[];
}

const queryPatterns = new Map<string, QueryPattern>();
const DETECTION_WINDOW = 10000; // 10 seconds
const N_PLUS_ONE_THRESHOLD = 5; // 5+ similar queries in window

// Normalize query to detect patterns
function normalizeQuery(query: string): string {
  return query
    .replace(/\$\d+/g, '$?') // Replace parameters
    .replace(/IN \([^)]+\)/g, 'IN (?)') // Replace IN clauses
    .replace(/= '[^']*'/g, "= '?'") // Replace string literals
    .replace(/= \d+/g, '= ?') // Replace numbers
    .trim();
}

// Detect N+1 query patterns
function detectNPlusOnePattern(normalizedQuery: string): boolean {
  const pattern = queryPatterns.get(normalizedQuery);
  if (!pattern) return false;
  
  const now = new Date();
  const recentQueries = pattern.timestamps.filter(
    timestamp => now.getTime() - timestamp.getTime() < DETECTION_WINDOW
  );
  
  return recentQueries.length >= N_PLUS_ONE_THRESHOLD;
}

// Log query analysis
function logQueryAnalysis(query: string, duration: number) {
  const normalized = normalizeQuery(query);
  const now = new Date();
  
  if (!queryPatterns.has(normalized)) {
    queryPatterns.set(normalized, {
      query: normalized,
      count: 0,
      duration: 0,
      timestamps: [],
    });
  }
  
  const pattern = queryPatterns.get(normalized)!;
  pattern.count++;
  pattern.duration += duration;
  pattern.timestamps.push(now);
  
  // Clean old timestamps
  pattern.timestamps = pattern.timestamps.filter(
    timestamp => now.getTime() - timestamp.getTime() < DETECTION_WINDOW
  );
  
  // Check for N+1 pattern
  if (detectNPlusOnePattern(normalized)) {
    console.warn('🚨 POTENTIAL N+1 QUERY DETECTED:');
    console.warn(`Query: ${normalized}`);
    console.warn(`Count in last ${DETECTION_WINDOW}ms: ${pattern.timestamps.length}`);
    console.warn(`Average duration: ${(pattern.duration / pattern.count).toFixed(2)}ms`);
    console.warn('---');
  }
}

// Monitor queries
prisma.$on('query', (e) => {
  logQueryAnalysis(e.query, e.duration);
});

// Report summary every 30 seconds
setInterval(() => {
  console.log('\n📊 QUERY ANALYSIS SUMMARY:');
  
  const sortedPatterns = Array.from(queryPatterns.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  sortedPatterns.forEach((pattern, index) => {
    const avgDuration = (pattern.duration / pattern.count).toFixed(2);
    console.log(`${index + 1}. Count: ${pattern.count}, Avg Duration: ${avgDuration}ms`);
    console.log(`   Query: ${pattern.query.substring(0, 100)}...`);
  });
  
  console.log('---\n');
}, 30000);

// Specific monitoring for known problematic queries
async function monitorScheduledReports() {
  try {
    const start = Date.now();
    await prisma.scheduledReport.findMany({
      where: {
        active: true,
        nextRunAt: {
          lte: new Date(),
        },
      },
    });
    const duration = Date.now() - start;
    
    if (duration > 100) {
      console.warn(`⚠️  Slow scheduled reports query: ${duration}ms`);
    }
  } catch (error) {
    console.error('Error monitoring scheduled reports:', error);
  }
}

// Monitor every 5 minutes
setInterval(monitorScheduledReports, 5 * 60 * 1000);

console.log('🔍 N+1 Query Monitor started...');
console.log('Monitoring for query patterns and performance issues...');

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n📋 FINAL QUERY REPORT:');
  
  const allPatterns = Array.from(queryPatterns.values())
    .sort((a, b) => b.count - a.count);
  
  allPatterns.forEach((pattern, index) => {
    if (pattern.count > 1) {
      const avgDuration = (pattern.duration / pattern.count).toFixed(2);
      console.log(`${index + 1}. Count: ${pattern.count}, Avg: ${avgDuration}ms`);
      console.log(`   ${pattern.query.substring(0, 150)}...`);
    }
  });
  
  process.exit(0);
});