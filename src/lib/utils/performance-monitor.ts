/**
 * Performance Monitoring Utilities
 * 
 * Provides utilities for monitoring and tracking performance metrics
 * including Core Web Vitals, API response times, and database query performance.
 */

import { Metric } from 'web-vitals';

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface APIPerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
}

export interface QueryPerformanceMetric {
  query: string;
  duration: number;
  timestamp: number;
}

/**
 * Core Web Vitals thresholds
 */
const WEB_VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  LCP: { good: 2500, poor: 4000 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

/**
 * Get rating for a metric value
 */
function getRating(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS];
  
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(metric: Metric) {
  const performanceMetric: PerformanceMetric = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    timestamp: Date.now(),
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 ${metric.name}:`, {
      value: metric.value,
      rating: performanceMetric.rating,
      id: metric.id,
    });
  }
  
  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production') {
    // Send to your analytics service
    // Example: sendToAnalytics(performanceMetric);
    
    // Send to API endpoint
    fetch('/api/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(performanceMetric),
    }).catch(console.error);
  }
}

/**
 * Monitor API performance
 */
export class APIPerformanceMonitor {
  private static metrics: APIPerformanceMetric[] = [];
  private static readonly MAX_METRICS = 100;
  
  static track(
    endpoint: string,
    method: string,
    duration: number,
    status: number
  ) {
    const metric: APIPerformanceMetric = {
      endpoint,
      method,
      duration,
      status,
      timestamp: Date.now(),
    };
    
    this.metrics.push(metric);
    
    // Keep only last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }
    
    // Log slow requests
    if (duration > 3000) {
      console.warn(`⚠️ Slow API request: ${method} ${endpoint} took ${duration}ms`);
    }
    
    // Log errors
    if (status >= 400) {
      console.error(`❌ API error: ${method} ${endpoint} returned ${status}`);
    }
  }
  
  static getMetrics(): APIPerformanceMetric[] {
    return [...this.metrics];
  }
  
  static getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.metrics.length;
  }
  
  static getSlowRequests(threshold = 3000): APIPerformanceMetric[] {
    return this.metrics.filter(m => m.duration > threshold);
  }
  
  static clear() {
    this.metrics = [];
  }
}

/**
 * Monitor database query performance
 */
export class QueryPerformanceMonitor {
  private static metrics: QueryPerformanceMetric[] = [];
  private static readonly MAX_METRICS = 100;
  private static readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  
  static async track<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;
      
      const metric: QueryPerformanceMetric = {
        query: queryName,
        duration,
        timestamp: Date.now(),
      };
      
      this.metrics.push(metric);
      
      // Keep only last MAX_METRICS
      if (this.metrics.length > this.MAX_METRICS) {
        this.metrics.shift();
      }
      
      // Log slow queries
      if (duration > this.SLOW_QUERY_THRESHOLD) {
        console.warn(`⚠️ Slow query: ${queryName} took ${duration.toFixed(2)}ms`);
        
        // In production, send to monitoring service
        if (process.env.NODE_ENV === 'production') {
          this.reportSlowQuery(metric);
        }
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ Query failed: ${queryName} after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }
  
  private static reportSlowQuery(metric: QueryPerformanceMetric) {
    // Send to monitoring service
    fetch('/api/monitoring/slow-queries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    }).catch(console.error);
  }
  
  static getMetrics(): QueryPerformanceMetric[] {
    return [...this.metrics];
  }
  
  static getSlowQueries(threshold = this.SLOW_QUERY_THRESHOLD): QueryPerformanceMetric[] {
    return this.metrics.filter(m => m.duration > threshold);
  }
  
  static getAverageQueryTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.metrics.length;
  }
  
  static clear() {
    this.metrics = [];
  }
}

/**
 * Performance budget checker
 */
export class PerformanceBudget {
  private static budgets = {
    pageLoadTime: 2000, // 2 seconds
    apiResponseTime: 500, // 500ms
    queryTime: 500, // 500ms
    bundleSize: 200 * 1024, // 200KB
  };
  
  static checkPageLoadTime(duration: number): boolean {
    const withinBudget = duration <= this.budgets.pageLoadTime;
    
    if (!withinBudget) {
      console.warn(
        `⚠️ Page load time exceeded budget: ${duration}ms > ${this.budgets.pageLoadTime}ms`
      );
    }
    
    return withinBudget;
  }
  
  static checkAPIResponseTime(duration: number): boolean {
    const withinBudget = duration <= this.budgets.apiResponseTime;
    
    if (!withinBudget) {
      console.warn(
        `⚠️ API response time exceeded budget: ${duration}ms > ${this.budgets.apiResponseTime}ms`
      );
    }
    
    return withinBudget;
  }
  
  static checkQueryTime(duration: number): boolean {
    const withinBudget = duration <= this.budgets.queryTime;
    
    if (!withinBudget) {
      console.warn(
        `⚠️ Query time exceeded budget: ${duration}ms > ${this.budgets.queryTime}ms`
      );
    }
    
    return withinBudget;
  }
  
  static setBudget(
    type: keyof typeof PerformanceBudget.budgets,
    value: number
  ) {
    this.budgets[type] = value;
  }
}

/**
 * Resource timing API wrapper
 */
export function getResourceTimings() {
  if (typeof window === 'undefined') return [];
  
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return resources.map(resource => ({
    name: resource.name,
    duration: resource.duration,
    size: resource.transferSize,
    type: resource.initiatorType,
  }));
}

/**
 * Get largest resources
 */
export function getLargestResources(limit = 10) {
  const resources = getResourceTimings();
  return resources
    .sort((a, b) => b.size - a.size)
    .slice(0, limit);
}

/**
 * Get slowest resources
 */
export function getSlowestResources(limit = 10) {
  const resources = getResourceTimings();
  return resources
    .sort((a, b) => b.duration - a.duration)
    .slice(0, limit);
}

/**
 * Performance mark and measure utilities
 */
export class PerformanceMarker {
  static mark(name: string) {
    if (typeof window === 'undefined') return;
    performance.mark(name);
  }
  
  static measure(name: string, startMark: string, endMark?: string) {
    if (typeof window === 'undefined') return;
    
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      return measure?.duration;
    } catch (error) {
      console.error('Error measuring performance:', error);
      return undefined;
    }
  }
  
  static clearMarks(name?: string) {
    if (typeof window === 'undefined') return;
    
    if (name) {
      performance.clearMarks(name);
    } else {
      performance.clearMarks();
    }
  }
  
  static clearMeasures(name?: string) {
    if (typeof window === 'undefined') return;
    
    if (name) {
      performance.clearMeasures(name);
    } else {
      performance.clearMeasures();
    }
  }
}

/**
 * Memory usage monitoring (Chrome only)
 */
export function getMemoryUsage() {
  if (typeof window === 'undefined') return null;
  
  const memory = (performance as any).memory;
  
  if (!memory) return null;
  
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  };
}
