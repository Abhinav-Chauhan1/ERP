# Web Vitals and CLS Optimization Guide

## Overview

This document provides guidance on measuring and optimizing Cumulative Layout Shift (CLS) and other Core Web Vitals metrics in the School ERP system.

## What is CLS?

Cumulative Layout Shift (CLS) measures visual stability. It quantifies how much unexpected layout shift occurs during the entire lifespan of a page. A good CLS score is less than 0.1.

## Web Vitals Tracking Implementation

### Components

1. **Web Vitals Tracker** (`src/components/shared/web-vitals-tracker.tsx`)
   - Initializes Web Vitals tracking on page load
   - Automatically tracks CLS, LCP, FID, FCP, and TTFB

2. **Web Vitals Utility** (`src/lib/utils/web-vitals.ts`)
   - Core tracking logic using the `web-vitals` library
   - Provides helper functions to check metric thresholds
   - Sends metrics to analytics endpoint

3. **Web Vitals Display** (`src/components/shared/web-vitals-display.tsx`)
   - Development-only component showing real-time metrics
   - Toggle with `Ctrl+Shift+V` keyboard shortcut
   - Color-coded ratings (green = good, yellow = needs improvement, red = poor)

4. **Web Vitals API** (`src/app/api/web-vitals/route.ts`)
   - Receives metrics from the client
   - Logs warnings for poor CLS scores
   - Can be extended to store metrics in database

### Usage

The Web Vitals tracking is automatically enabled in the root layout. No additional setup is required.

To view metrics in development:
1. Open any page in the application
2. Press `Ctrl+Shift+V` to toggle the Web Vitals display
3. Monitor the CLS score and other metrics

## CLS Optimization Strategies

### 1. Reserve Space for Images

**Problem**: Images without dimensions cause layout shifts when they load.

**Solution**: Always specify width and height attributes.

```tsx
// ❌ Bad - No dimensions
<img src="/image.jpg" alt="Description" />

// ✅ Good - Dimensions specified
<img src="/image.jpg" alt="Description" width={800} height={600} />

// ✅ Better - Using Next.js Image component
import Image from 'next/image';
<Image src="/image.jpg" alt="Description" width={800} height={600} />
```

**Status**: ✅ Implemented in task 78

### 2. Use Skeleton Loaders

**Problem**: Content loading causes layout shifts.

**Solution**: Use skeleton loaders that match the dimensions of final content.

```tsx
// ✅ Good - Skeleton loader matches content dimensions
{isLoading ? (
  <div className="h-24 w-full bg-gray-200 animate-pulse rounded" />
) : (
  <div className="h-24 w-full">
    {/* Actual content */}
  </div>
)}
```

**Status**: ✅ Implemented in task 77

### 3. Implement Suspense Boundaries

**Problem**: Dynamic content loading causes layout shifts.

**Solution**: Use React Suspense with fallbacks.

```tsx
import { Suspense } from 'react';

<Suspense fallback={<LoadingSkeleton />}>
  <DynamicContent />
</Suspense>
```

**Status**: ✅ Implemented in task 79

### 4. Optimize Font Loading

**Problem**: Font loading can cause FOIT (Flash of Invisible Text) or layout shifts.

**Solution**: Use `font-display: swap` and preload fonts.

```tsx
// In layout.tsx
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Show fallback font immediately
  preload: true,
  fallback: ['system-ui', 'arial'],
});
```

**Status**: ✅ Implemented in task 80

### 5. Avoid Inserting Content Above Existing Content

**Problem**: Dynamically inserting content above existing content causes shifts.

**Solution**: 
- Reserve space for dynamic content
- Insert new content at the bottom
- Use fixed heights for containers

```tsx
// ❌ Bad - Inserting at top
<div>
  {newContent && <Banner />}
  <MainContent />
</div>

// ✅ Good - Reserved space
<div>
  <div className="h-16"> {/* Fixed height */}
    {newContent && <Banner />}
  </div>
  <MainContent />
</div>
```

### 6. Avoid Animations that Trigger Layout

**Problem**: CSS animations that change layout properties cause shifts.

**Solution**: Use `transform` and `opacity` for animations.

```css
/* ❌ Bad - Triggers layout */
.element {
  transition: height 0.3s;
}

/* ✅ Good - Doesn't trigger layout */
.element {
  transition: transform 0.3s, opacity 0.3s;
}
```

### 7. Set Explicit Dimensions for Ads and Embeds

**Problem**: Third-party content without dimensions causes shifts.

**Solution**: Reserve space with min-height or aspect-ratio.

```tsx
// ✅ Good - Reserved space for ad
<div className="min-h-[250px] w-full">
  <AdComponent />
</div>
```

## Measuring CLS

### In Development

1. Open the application in development mode
2. Press `Ctrl+Shift+V` to show the Web Vitals display
3. Navigate through the application
4. Monitor the CLS score (should be < 0.1)

### In Production

1. Use Chrome DevTools:
   - Open DevTools (F12)
   - Go to Performance tab
   - Record a page load
   - Look for "Experience" section showing CLS

2. Use Lighthouse:
   - Open DevTools (F12)
   - Go to Lighthouse tab
   - Run audit
   - Check "Cumulative Layout Shift" metric

3. Use Web Vitals API:
   - Metrics are automatically sent to `/api/web-vitals`
   - Check server logs for CLS warnings
   - Extend API to store metrics in database for analysis

## CLS Thresholds

- **Good**: < 0.1 (green)
- **Needs Improvement**: 0.1 - 0.25 (yellow)
- **Poor**: > 0.25 (red)

## Common CLS Issues in the ERP System

### 1. Data Tables Loading
- **Issue**: Tables without skeleton loaders
- **Solution**: Use table skeleton loaders (implemented in task 77)

### 2. Dashboard Widgets
- **Issue**: Widgets loading at different times
- **Solution**: Use Suspense boundaries with consistent fallbacks

### 3. Images in Lists
- **Issue**: Student/teacher photos without dimensions
- **Solution**: Use Next.js Image component with explicit dimensions

### 4. Dynamic Forms
- **Issue**: Form fields appearing/disappearing based on conditions
- **Solution**: Reserve space or use smooth transitions

## Core Web Vitals Tracked

The system tracks the following Core Web Vitals:

- **CLS (Cumulative Layout Shift)**: < 0.1 (good)
- **LCP (Largest Contentful Paint)**: < 2.5s (good)
- **INP (Interaction to Next Paint)**: < 200ms (good) - replaces FID
- **FCP (First Contentful Paint)**: < 1.8s (target)
- **TTFB (Time to First Byte)**: < 600ms (target)

Note: INP (Interaction to Next Paint) has replaced FID (First Input Delay) as a Core Web Vital as of March 2024.

## Monitoring and Alerts

### Current Implementation

- Web Vitals are tracked automatically
- Metrics are logged to console in development
- API endpoint receives metrics in production
- Warnings are logged for CLS > 0.1

### Future Enhancements

1. **Database Storage**: Store metrics in database for historical analysis
2. **Dashboard**: Create admin dashboard showing Web Vitals trends
3. **Alerts**: Send email/Slack alerts when CLS exceeds threshold
4. **User Segmentation**: Track metrics by user role, device, browser
5. **Page-Level Analysis**: Identify specific pages with poor CLS

## Testing

### Manual Testing

1. Navigate to different pages
2. Check Web Vitals display (Ctrl+Shift+V)
3. Verify CLS < 0.1 on all major pages

### Automated Testing

Property-based test for CLS compliance is defined in task 81.1:
- **Property 55: CLS Score Compliance**
- Validates that CLS score is below 0.1

## Resources

- [Web Vitals Documentation](https://web.dev/vitals/)
- [CLS Optimization Guide](https://web.dev/optimize-cls/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [web-vitals Library](https://github.com/GoogleChrome/web-vitals)

## Checklist

- [x] Install web-vitals library
- [x] Create Web Vitals tracking utility
- [x] Add Web Vitals tracker to root layout
- [x] Create Web Vitals display component
- [x] Create Web Vitals API endpoint
- [x] Document CLS optimization strategies
- [x] Implement skeleton loaders (task 77)
- [x] Add image dimensions (task 78)
- [x] Implement Suspense boundaries (task 79)
- [x] Optimize font loading (task 80)
- [ ] Run Lighthouse audits on all major pages
- [ ] Verify CLS < 0.1 on all pages
- [ ] Create property test for CLS compliance (task 81.1)
