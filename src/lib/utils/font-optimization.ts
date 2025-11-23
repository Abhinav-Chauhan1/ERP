/**
 * Font Optimization Utilities
 * 
 * This module provides utilities for optimizing font loading performance
 * and preventing FOIT (Flash of Invisible Text).
 * 
 * Key optimizations:
 * 1. font-display: swap - Shows fallback font immediately while custom font loads
 * 2. Preloading - Loads fonts earlier in the page lifecycle
 * 3. Fallback fonts - Provides system fonts as backup
 * 4. Font subsetting - Only loads required character sets
 */

/**
 * System font stack for fallback
 * These fonts are available on most operating systems and provide good readability
 */
export const SYSTEM_FONT_STACK = [
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
  'Roboto',
  'Oxygen',
  'Ubuntu',
  'Cantarell',
  'Fira Sans',
  'Droid Sans',
  'Helvetica Neue',
  'sans-serif',
].join(', ');

/**
 * Font display strategies
 * 
 * - auto: Browser default behavior
 * - block: Hide text briefly, then show with custom font (can cause FOIT)
 * - swap: Show fallback immediately, swap when custom font loads (prevents FOIT) ✓ RECOMMENDED
 * - fallback: Brief block period, then show fallback if font not loaded
 * - optional: Brief block period, then use fallback if font not loaded (no swap)
 */
export type FontDisplay = 'auto' | 'block' | 'swap' | 'fallback' | 'optional';

/**
 * Configuration for optimal font loading
 */
export const FONT_CONFIG = {
  display: 'swap' as FontDisplay, // Prevent FOIT by showing fallback immediately
  preload: true, // Preload fonts for faster initial load
  adjustFontFallback: true, // Adjust fallback font metrics to reduce layout shift
} as const;

/**
 * Get font loading CSS for manual font declarations
 * 
 * @param fontFamily - The font family name
 * @param fontDisplay - The font-display strategy (default: 'swap')
 * @returns CSS string for @font-face declaration
 */
export function getFontLoadingCSS(
  fontFamily: string,
  fontDisplay: FontDisplay = 'swap'
): string {
  return `
    @font-face {
      font-family: '${fontFamily}';
      font-display: ${fontDisplay};
    }
  `;
}

/**
 * Check if fonts are loaded
 * Uses the Font Loading API to detect when fonts are ready
 * 
 * @param fontFamily - The font family to check
 * @returns Promise that resolves when font is loaded
 */
export async function waitForFontLoad(fontFamily: string): Promise<boolean> {
  if (typeof document === 'undefined') {
    return false;
  }

  try {
    // Use Font Loading API if available
    if ('fonts' in document) {
      await document.fonts.load(`1em ${fontFamily}`);
      return document.fonts.check(`1em ${fontFamily}`);
    }
    return false;
  } catch (error) {
    console.warn(`Failed to check font loading for ${fontFamily}:`, error);
    return false;
  }
}

/**
 * Preload font files
 * Adds <link rel="preload"> for faster font loading
 * 
 * Note: Next.js automatically handles this for next/font/google fonts
 * This is useful for custom fonts
 * 
 * @param fontUrl - URL to the font file
 * @param fontType - Font file type (woff2, woff, ttf, etc.)
 */
export function preloadFont(fontUrl: string, fontType: string = 'woff2'): void {
  if (typeof document === 'undefined') {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = `font/${fontType}`;
  link.href = fontUrl;
  link.crossOrigin = 'anonymous'; // Required for CORS
  
  document.head.appendChild(link);
}

/**
 * Get optimal font loading strategy based on connection speed
 * 
 * @returns Recommended font display strategy
 */
export function getOptimalFontDisplay(): FontDisplay {
  if (typeof navigator === 'undefined') {
    return 'swap'; // Default to swap on server
  }

  // Check for slow connection
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (connection) {
    const effectiveType = connection.effectiveType;
    
    // On slow connections, use 'optional' to avoid waiting for fonts
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'optional';
    }
    
    // On 3G, use 'fallback' for a balance
    if (effectiveType === '3g') {
      return 'fallback';
    }
  }
  
  // Default to 'swap' for best user experience (prevents FOIT)
  return 'swap';
}

/**
 * Font loading performance metrics
 */
export interface FontMetrics {
  fontFamily: string;
  loadTime: number;
  isLoaded: boolean;
  displayStrategy: FontDisplay;
}

/**
 * Measure font loading performance
 * 
 * @param fontFamily - The font family to measure
 * @returns Font loading metrics
 */
export async function measureFontLoading(fontFamily: string): Promise<FontMetrics> {
  const startTime = performance.now();
  const isLoaded = await waitForFontLoad(fontFamily);
  const loadTime = performance.now() - startTime;
  
  return {
    fontFamily,
    loadTime,
    isLoaded,
    displayStrategy: getOptimalFontDisplay(),
  };
}
