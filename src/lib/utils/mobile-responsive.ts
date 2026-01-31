/**
 * Mobile Responsive Utilities
 * 
 * Provides utilities for mobile-responsive design and touch interactions
 */

import { useEffect, useState } from 'react';

export interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

export const breakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export type BreakpointKey = keyof BreakpointConfig;

/**
 * Hook to detect current screen size
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<BreakpointKey>('lg');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < breakpoints.sm) {
        setBreakpoint('sm');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width < breakpoints.md) {
        setBreakpoint('md');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width < breakpoints.lg) {
        setBreakpoint('lg');
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else if (width < breakpoints.xl) {
        setBreakpoint('xl');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      } else {
        setBreakpoint('2xl');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
  };
}

/**
 * Hook to detect touch device
 */
export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouchDevice();
  }, []);

  return isTouchDevice;
}

/**
 * Mobile-friendly class names
 */
export const mobileClasses = {
  // Spacing
  padding: {
    mobile: 'p-4',
    tablet: 'p-6',
    desktop: 'p-8',
  },
  margin: {
    mobile: 'm-2',
    tablet: 'm-4',
    desktop: 'm-6',
  },
  
  // Grid layouts
  grid: {
    mobile: 'grid-cols-1',
    tablet: 'grid-cols-2',
    desktop: 'grid-cols-3',
    wide: 'grid-cols-4',
  },
  
  // Text sizes
  text: {
    mobile: 'text-sm',
    tablet: 'text-base',
    desktop: 'text-lg',
  },
  
  // Button sizes
  button: {
    mobile: 'px-3 py-2 text-sm',
    tablet: 'px-4 py-2 text-base',
    desktop: 'px-6 py-3 text-lg',
  },
  
  // Card layouts
  card: {
    mobile: 'p-4 space-y-3',
    tablet: 'p-6 space-y-4',
    desktop: 'p-8 space-y-6',
  },
};

/**
 * Get responsive class names based on current breakpoint
 */
export function getResponsiveClasses(
  classes: Record<string, string>,
  breakpoint: BreakpointKey
): string {
  if (breakpoint === 'sm' || breakpoint === 'md') {
    return classes.mobile || classes.tablet || classes.desktop || '';
  } else if (breakpoint === 'lg') {
    return classes.tablet || classes.desktop || '';
  } else {
    return classes.desktop || '';
  }
}

/**
 * Touch-friendly event handlers
 */
export const touchHandlers = {
  /**
   * Enhanced click handler that works well on touch devices
   */
  onClick: (handler: () => void) => ({
    onClick: handler,
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      handler();
    },
  }),

  /**
   * Long press handler for touch devices
   */
  onLongPress: (handler: () => void, delay: number = 500) => {
    let timeout: NodeJS.Timeout;
    
    return {
      onTouchStart: () => {
        timeout = setTimeout(handler, delay);
      },
      onTouchEnd: () => {
        clearTimeout(timeout);
      },
      onTouchMove: () => {
        clearTimeout(timeout);
      },
      onMouseDown: () => {
        timeout = setTimeout(handler, delay);
      },
      onMouseUp: () => {
        clearTimeout(timeout);
      },
      onMouseLeave: () => {
        clearTimeout(timeout);
      },
    };
  },
};

/**
 * Mobile-optimized table configuration
 */
export const mobileTableConfig = {
  /**
   * Convert table to card layout on mobile
   */
  getTableClasses: (isMobile: boolean) => ({
    container: isMobile ? 'space-y-4' : 'overflow-x-auto',
    table: isMobile ? 'hidden' : 'min-w-full table-auto',
    cardContainer: isMobile ? 'block' : 'hidden',
  }),

  /**
   * Get column visibility based on screen size
   */
  getColumnVisibility: (breakpoint: BreakpointKey) => ({
    hideOnMobile: breakpoint === 'sm' || breakpoint === 'md' ? 'hidden' : 'table-cell',
    hideOnTablet: breakpoint === 'sm' || breakpoint === 'md' || breakpoint === 'lg' ? 'hidden' : 'table-cell',
    showOnDesktop: breakpoint === 'xl' || breakpoint === '2xl' ? 'table-cell' : 'hidden',
  }),
};

/**
 * Mobile navigation utilities
 */
export const mobileNavigation = {
  /**
   * Get navigation layout classes
   */
  getNavClasses: (isMobile: boolean) => ({
    container: isMobile ? 'fixed bottom-0 left-0 right-0 z-50' : 'relative',
    nav: isMobile ? 'flex justify-around bg-white border-t shadow-lg' : 'flex space-x-4',
    item: isMobile ? 'flex-1 py-2 px-1 text-center' : 'px-3 py-2',
  }),

  /**
   * Mobile-friendly sidebar configuration
   */
  getSidebarClasses: (isMobile: boolean, isOpen: boolean) => ({
    overlay: isMobile && isOpen ? 'fixed inset-0 bg-black bg-opacity-50 z-40' : 'hidden',
    sidebar: isMobile 
      ? `fixed left-0 top-0 h-full w-64 bg-white transform transition-transform z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`
      : 'relative w-64 bg-white',
  }),
};

/**
 * Form optimization for mobile
 */
export const mobileFormConfig = {
  /**
   * Get form field classes optimized for mobile
   */
  getFieldClasses: (isMobile: boolean) => ({
    container: isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-4',
    input: isMobile ? 'text-base' : 'text-sm', // Prevent zoom on iOS
    label: isMobile ? 'text-sm font-medium' : 'text-sm',
    button: isMobile ? 'w-full py-3 text-base' : 'px-6 py-2 text-sm',
  }),

  /**
   * Mobile-optimized input attributes
   */
  getMobileInputProps: () => ({
    autoComplete: 'off',
    autoCorrect: 'off',
    autoCapitalize: 'off',
    spellCheck: false,
  }),
};

/**
 * Performance optimizations for mobile
 */
export const mobilePerformance = {
  /**
   * Debounce function for search inputs
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  /**
   * Throttle function for scroll events
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  },

  /**
   * Lazy loading configuration
   */
  lazyLoadConfig: {
    rootMargin: '50px',
    threshold: 0.1,
  },
};

/**
 * Accessibility helpers for mobile
 */
export const mobileAccessibility = {
  /**
   * Get touch target size (minimum 44px for accessibility)
   */
  getTouchTargetClasses: () => 'min-h-[44px] min-w-[44px]',

  /**
   * Focus management for mobile
   */
  getFocusClasses: () => 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',

  /**
   * Screen reader optimizations
   */
  getScreenReaderClasses: () => 'sr-only sm:not-sr-only',
};