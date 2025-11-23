/**
 * Web Vitals Tracking Utility
 * 
 * This module provides utilities for tracking Core Web Vitals metrics
 * including CLS (Cumulative Layout Shift), LCP (Largest Contentful Paint),
 * FID (First Input Delay), FCP (First Contentful Paint), and TTFB (Time to First Byte).
 * 
 * These metrics are essential for monitoring and optimizing user experience.
 */

import { onCLS, onINP, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';

export interface WebVitalsMetrics {
  CLS: number;  // Cumulative Layout Shift
  INP: number;  // Interaction to Next Paint (replaces FID)
  LCP: number;  // Largest Contentful Paint
  FCP: number;  // First Contentful Paint
  TTFB: number; // Time to First Byte
}

// Store metrics in memory
const metrics: Partial<WebVitalsMetrics> = {};

/**
 * Send metric to analytics endpoint
 */
function sendToAnalytics(metric: Metric) {
  // Store in memory for retrieval
  metrics[metric.name as keyof WebVitalsMetrics] = metric.value;

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric);
  }

  // Send to analytics endpoint (if configured)
  const analyticsEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  if (analyticsEndpoint) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      url: window.location.href,
      timestamp: Date.now(),
    });

    // Use sendBeacon if available, fallback to fetch
    if (navigator.sendBeacon) {
      navigator.sendBeacon(analyticsEndpoint, body);
    } else {
      fetch(analyticsEndpoint, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(console.error);
    }
  }
}

/**
 * Initialize Web Vitals tracking
 * Call this function once when the app loads
 */
export function initWebVitals() {
  // Track all Core Web Vitals
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

/**
 * Get current Web Vitals metrics
 */
export function getWebVitals(): Partial<WebVitalsMetrics> {
  return { ...metrics };
}

/**
 * Check if CLS is within acceptable threshold
 * Good: < 0.1, Needs Improvement: 0.1-0.25, Poor: > 0.25
 */
export function isCLSGood(cls?: number): boolean {
  const clsValue = cls ?? metrics.CLS;
  return clsValue !== undefined && clsValue < 0.1;
}

/**
 * Check if LCP is within acceptable threshold
 * Good: < 2.5s, Needs Improvement: 2.5-4s, Poor: > 4s
 */
export function isLCPGood(lcp?: number): boolean {
  const lcpValue = lcp ?? metrics.LCP;
  return lcpValue !== undefined && lcpValue < 2500;
}

/**
 * Check if INP is within acceptable threshold
 * Good: < 200ms, Needs Improvement: 200-500ms, Poor: > 500ms
 */
export function isINPGood(inp?: number): boolean {
  const inpValue = inp ?? metrics.INP;
  return inpValue !== undefined && inpValue < 200;
}

/**
 * Get Web Vitals rating
 */
export function getWebVitalsRating(): {
  CLS: 'good' | 'needs-improvement' | 'poor' | 'unknown';
  LCP: 'good' | 'needs-improvement' | 'poor' | 'unknown';
  INP: 'good' | 'needs-improvement' | 'poor' | 'unknown';
} {
  const cls = metrics.CLS;
  const lcp = metrics.LCP;
  const inp = metrics.INP;

  return {
    CLS: cls === undefined ? 'unknown' : cls < 0.1 ? 'good' : cls < 0.25 ? 'needs-improvement' : 'poor',
    LCP: lcp === undefined ? 'unknown' : lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor',
    INP: inp === undefined ? 'unknown' : inp < 200 ? 'good' : inp < 500 ? 'needs-improvement' : 'poor',
  };
}
