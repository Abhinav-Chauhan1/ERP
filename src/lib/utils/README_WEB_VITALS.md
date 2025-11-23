# Web Vitals Tracking

This module provides utilities for tracking Core Web Vitals metrics in the School ERP system.

## Quick Start

Web Vitals tracking is automatically enabled in the application. No setup required!

### View Metrics in Development

1. Start the development server: `npm run dev`
2. Open any page in the application
3. Press `Ctrl+Shift+V` to toggle the Web Vitals display
4. Monitor the metrics in real-time

## Metrics Tracked

### CLS (Cumulative Layout Shift)
- **What it measures**: Visual stability - how much content shifts unexpectedly
- **Good**: < 0.1
- **Needs Improvement**: 0.1 - 0.25
- **Poor**: > 0.25

### LCP (Largest Contentful Paint)
- **What it measures**: Loading performance - when the largest content element becomes visible
- **Good**: < 2.5s
- **Needs Improvement**: 2.5s - 4s
- **Poor**: > 4s

### INP (Interaction to Next Paint)
- **What it measures**: Responsiveness - time from user interaction to visual response
- **Good**: < 200ms
- **Needs Improvement**: 200ms - 500ms
- **Poor**: > 500ms

### FCP (First Contentful Paint)
- **What it measures**: When the first content appears on screen
- **Target**: < 1.8s

### TTFB (Time to First Byte)
- **What it measures**: Server response time
- **Target**: < 600ms

## API Usage

### Initialize Tracking

```typescript
import { initWebVitals } from '@/lib/utils/web-vitals';

// Call once when app loads (already done in root layout)
initWebVitals();
```

### Get Current Metrics

```typescript
import { getWebVitals } from '@/lib/utils/web-vitals';

const metrics = getWebVitals();
console.log('CLS:', metrics.CLS);
console.log('LCP:', metrics.LCP);
```

### Check Metric Thresholds

```typescript
import { isCLSGood, isLCPGood, isINPGood } from '@/lib/utils/web-vitals';

if (isCLSGood()) {
  console.log('CLS is within acceptable threshold');
}
```

### Get Ratings

```typescript
import { getWebVitalsRating } from '@/lib/utils/web-vitals';

const ratings = getWebVitalsRating();
console.log('CLS rating:', ratings.CLS); // 'good' | 'needs-improvement' | 'poor' | 'unknown'
```

## Analytics Integration

Metrics are automatically sent to `/api/web-vitals` endpoint. To send to an external analytics service:

1. Set environment variable:
   ```
   NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-analytics-service.com/api/metrics
   ```

2. Metrics will be sent using `navigator.sendBeacon()` or `fetch()` with keepalive

## Components

### WebVitalsTracker
- Initializes tracking on mount
- Included in root layout
- No props required

### WebVitalsDisplay
- Shows real-time metrics in development
- Toggle with `Ctrl+Shift+V`
- Color-coded ratings
- Included in root layout

## Files

- `src/lib/utils/web-vitals.ts` - Core tracking logic
- `src/components/shared/web-vitals-tracker.tsx` - Initialization component
- `src/components/shared/web-vitals-display.tsx` - Development display
- `src/app/api/web-vitals/route.ts` - API endpoint for receiving metrics

## Optimization Tips

See `docs/WEB_VITALS_CLS_OPTIMIZATION.md` for detailed optimization strategies.

### Quick Tips for CLS

1. Always specify image dimensions
2. Use skeleton loaders
3. Reserve space for dynamic content
4. Use `font-display: swap`
5. Avoid inserting content above existing content

## Troubleshooting

### Metrics not appearing
- Check browser console for errors
- Ensure you're in development mode
- Press `Ctrl+Shift+V` to show display

### High CLS score
- Check for images without dimensions
- Look for content loading without skeleton loaders
- Verify Suspense boundaries are in place
- Check for dynamic content insertion

### Metrics not sent to analytics
- Verify `NEXT_PUBLIC_ANALYTICS_ENDPOINT` is set
- Check network tab for failed requests
- Ensure endpoint accepts POST requests with JSON body

## Resources

- [Web Vitals Documentation](https://web.dev/vitals/)
- [web-vitals Library](https://github.com/GoogleChrome/web-vitals)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
