/**
 * Lazy Loading and Code Splitting Utilities
 * Provides helpers for implementing dynamic imports and lazy loading
 */

import dynamic from "next/dynamic";
import { ComponentType, createElement } from "react";

/**
 * Note: Loading components should be created as separate .tsx files
 * These are type definitions for reference
 */
export type LoadingFallbackProps = { message?: string };
export type SkeletonFallbackProps = Record<string, never>;

/**
 * Create a lazy-loaded component with custom loading fallback
 */
export function createLazyComponent<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: ComponentType;
    ssr?: boolean;
  }
) {
  const { loading, ssr = true } = options || {};
  
  return dynamic(importFn, {
    loading: loading ? () => createElement(loading) : undefined,
    ssr,
  });
}

/**
 * Example: Lazy load heavy chart components
 * 
 * export const LazyChart = createLazyComponent(
 *   () => import("@/components/dashboard/chart"),
 *   {
 *     ssr: false, // Charts don't need SSR
 *   }
 * );
 * 
 * Example: Lazy load data tables
 * 
 * export const LazyDataTable = createLazyComponent(
 *   () => import("@/components/ui/data-table")
 * );
 * 
 * Example: Lazy load rich text editor
 * 
 * export const LazyRichTextEditor = createLazyComponent(
 *   () => import("@/components/forms/rich-text-editor").then(mod => ({ default: mod.RichTextEditor })),
 *   {
 *     ssr: false, // Rich text editors typically don't work with SSR
 *   }
 * );
 */

/**
 * Lazy load modal dialogs
 */
export function createLazyModal<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>
) {
  return createLazyComponent(importFn, {
    ssr: false, // Modals are client-side only
  });
}

/**
 * Preload a component for better UX
 * Call this on hover or focus to preload before user clicks
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>
) {
  // Trigger the import but don't wait for it
  importFn().catch((error) => {
    console.error("Failed to preload component:", error);
  });
}

/**
 * Image optimization helper
 * Provides recommended props for Next.js Image component
 */
export const IMAGE_SIZES = {
  avatar: {
    width: 40,
    height: 40,
    sizes: "(max-width: 768px) 40px, 40px",
  },
  avatarLarge: {
    width: 100,
    height: 100,
    sizes: "(max-width: 768px) 100px, 100px",
  },
  thumbnail: {
    width: 200,
    height: 200,
    sizes: "(max-width: 768px) 200px, 200px",
  },
  card: {
    width: 400,
    height: 300,
    sizes: "(max-width: 768px) 100vw, 400px",
  },
  hero: {
    width: 1200,
    height: 600,
    sizes: "(max-width: 768px) 100vw, 1200px",
  },
  full: {
    width: 1920,
    height: 1080,
    sizes: "100vw",
  },
} as const;

/**
 * Get optimized image props for Next.js Image component
 */
export function getImageProps(
  size: keyof typeof IMAGE_SIZES,
  options?: {
    priority?: boolean;
    quality?: number;
  }
) {
  const { priority = false, quality = 75 } = options || {};
  
  return {
    ...IMAGE_SIZES[size],
    priority,
    quality,
    loading: priority ? ("eager" as const) : ("lazy" as const),
  };
}

/**
 * Intersection Observer hook for lazy loading
 * Use this for custom lazy loading logic
 */
export function useIntersectionObserver(
  callback: () => void,
  options?: IntersectionObserverInit
) {
  if (typeof window === "undefined") {
    return null;
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback();
        observer.disconnect();
      }
    });
  }, options);
  
  return observer;
}

/**
 * Bundle size optimization tips
 * 
 * 1. Use dynamic imports for large components:
 *    const HeavyComponent = dynamic(() => import('./HeavyComponent'))
 * 
 * 2. Use Next.js Image component for automatic optimization:
 *    <Image src={src} {...getImageProps('card')} alt="..." />
 * 
 * 3. Lazy load below-the-fold content:
 *    const BelowFold = createLazyComponent(() => import('./BelowFold'))
 * 
 * 4. Preload critical components on hover:
 *    onMouseEnter={() => preloadComponent(() => import('./Modal'))}
 * 
 * 5. Use tree-shaking friendly imports:
 *    import { Button } from '@/components/ui/button' // Good
 *    import * as UI from '@/components/ui' // Bad
 * 
 * 6. Analyze bundle size:
 *    npm run build -- --analyze
 * 
 * 7. Use loading="lazy" for images:
 *    <img src={src} loading="lazy" alt="..." />
 * 
 * 8. Split vendor chunks in next.config.js:
 *    webpack: (config) => {
 *      config.optimization.splitChunks = {
 *        chunks: 'all',
 *        cacheGroups: {
 *          vendor: {
 *            test: /[\\/]node_modules[\\/]/,
 *            name: 'vendors',
 *            priority: 10,
 *          },
 *        },
 *      };
 *      return config;
 *    }
 */

/**
 * Example usage in components:
 * 
 * // Lazy load a heavy chart component
 * import { LazyChart } from '@/lib/utils/lazy-loading';
 * 
 * export function Dashboard() {
 *   return (
 *     <div>
 *       <h1>Dashboard</h1>
 *       <LazyChart data={data} />
 *     </div>
 *   );
 * }
 * 
 * // Preload on hover
 * import { preloadComponent } from '@/lib/utils/lazy-loading';
 * 
 * export function Button() {
 *   return (
 *     <button
 *       onMouseEnter={() => preloadComponent(() => import('./Modal'))}
 *       onClick={() => setShowModal(true)}
 *     >
 *       Open Modal
 *     </button>
 *   );
 * }
 * 
 * // Optimized images
 * import Image from 'next/image';
 * import { getImageProps } from '@/lib/utils/lazy-loading';
 * 
 * export function Avatar({ src }: { src: string }) {
 *   return (
 *     <Image
 *       src={src}
 *       {...getImageProps('avatar')}
 *       alt="User avatar"
 *     />
 *   );
 * }
 */
