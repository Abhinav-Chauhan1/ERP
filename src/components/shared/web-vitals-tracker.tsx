'use client';

/**
 * Web Vitals Tracker Component
 * 
 * This component initializes Web Vitals tracking when mounted.
 * It should be included in the root layout to track metrics across all pages.
 */

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/utils/web-vitals';

export function WebVitalsTracker() {
  useEffect(() => {
    // Initialize Web Vitals tracking
    initWebVitals();
  }, []);

  // This component doesn't render anything
  return null;
}
