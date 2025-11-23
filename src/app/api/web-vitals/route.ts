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

export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalMetric = await request.json();

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
      console.warn(`[Web Vitals] CLS score ${metric.value} exceeds threshold of 0.1 on ${metric.url}`);
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
