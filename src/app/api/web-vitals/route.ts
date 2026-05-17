import { NextRequest, NextResponse } from 'next/server';

/**
 * Web Vitals API Endpoint
 * 
 * This endpoint receives Web Vitals metrics from the client
 * and can store them in a database or send to an analytics service.
 */

interface WebVitalMetric {
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
  navigationType: string;
  url: string;
  timestamp: number;
}

const VALID_METRIC_NAMES = new Set(['CLS', 'FID', 'FCP', 'INP', 'LCP', 'TTFB']);
const VALID_RATINGS = new Set(['good', 'needs-improvement', 'poor']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate and sanitize all string inputs to prevent log injection
    const name = typeof body.name === 'string' && VALID_METRIC_NAMES.has(body.name) ? body.name : null;
    const value = typeof body.value === 'number' && Number.isFinite(body.value) ? body.value : null;
    const rating = typeof body.rating === 'string' && VALID_RATINGS.has(body.rating) ? body.rating : 'unknown';
    const url = typeof body.url === 'string' ? body.url.slice(0, 512) : '';
    const timestamp = typeof body.timestamp === 'number' ? body.timestamp : Date.now();

    if (!name || value === null) {
      return NextResponse.json({ success: false, error: 'Invalid metric' }, { status: 400 });
    }

    const metric: WebVitalMetric = { name, value, rating, delta: 0, id: '', navigationType: '', url, timestamp };

    // Log the metric (in production, you'd store this in a database or send to analytics)
    console.log('[Web Vitals API]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: metric.url,
      timestamp: new Date(metric.timestamp).toISOString(),
    });

    // Check if CLS is within acceptable threshold
    if (metric.name === 'CLS' && metric.value >= 0.1) {
      console.warn(`[Web Vitals] CLS score ${metric.value} exceeds threshold of 0.1`);
    }

    // TODO: Store metrics in database for analysis
    // await db.webVitalMetric.create({
    //   data: {
    //     name: metric.name,
    //     value: metric.value,
    //     rating: metric.rating,
    //     url: metric.url,
    //     timestamp: new Date(metric.timestamp),
    //   },
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Web Vitals API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process metric' },
      { status: 500 }
    );
  }
}
