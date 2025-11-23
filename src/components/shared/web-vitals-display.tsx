'use client';

/**
 * Web Vitals Display Component
 * 
 * This component displays real-time Web Vitals metrics in development mode.
 * It shows CLS, LCP, FID, FCP, and TTFB with color-coded ratings.
 */

import { useEffect, useState } from 'react';
import { getWebVitals, getWebVitalsRating, type WebVitalsMetrics } from '@/lib/utils/web-vitals';

export function WebVitalsDisplay() {
  const [metrics, setMetrics] = useState<Partial<WebVitalsMetrics>>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Update metrics every second
    const interval = setInterval(() => {
      setMetrics(getWebVitals());
    }, 1000);

    // Listen for keyboard shortcut (Ctrl+Shift+V) to toggle visibility
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null;
  }

  const ratings = getWebVitalsRating();

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'bg-green-500';
      case 'needs-improvement':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatValue = (name: string, value?: number) => {
    if (value === undefined) return 'N/A';
    
    // CLS is unitless
    if (name === 'CLS') {
      return value.toFixed(3);
    }
    
    // Time-based metrics in milliseconds
    return `${Math.round(value)}ms`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Web Vitals
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close Web Vitals display"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        {/* CLS */}
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">CLS:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-900 dark:text-gray-100">
              {formatValue('CLS', metrics.CLS)}
            </span>
            <span className={`w-2 h-2 rounded-full ${getRatingColor(ratings.CLS)}`} />
          </div>
        </div>

        {/* LCP */}
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">LCP:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-900 dark:text-gray-100">
              {formatValue('LCP', metrics.LCP)}
            </span>
            <span className={`w-2 h-2 rounded-full ${getRatingColor(ratings.LCP)}`} />
          </div>
        </div>

        {/* INP */}
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">INP:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-900 dark:text-gray-100">
              {formatValue('INP', metrics.INP)}
            </span>
            <span className={`w-2 h-2 rounded-full ${getRatingColor(ratings.INP)}`} />
          </div>
        </div>

        {/* FCP */}
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">FCP:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-900 dark:text-gray-100">
              {formatValue('FCP', metrics.FCP)}
            </span>
          </div>
        </div>

        {/* TTFB */}
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">TTFB:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-900 dark:text-gray-100">
              {formatValue('TTFB', metrics.TTFB)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+Shift+V</kbd> to toggle
        </p>
      </div>
    </div>
  );
}
