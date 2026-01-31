/**
 * Accessibility Utilities
 * 
 * Provides utilities for improving accessibility (a11y) across the application
 */

import { useEffect, useState } from 'react';

/**
 * ARIA attributes and roles
 */
export const aria = {
  // Common ARIA attributes
  attributes: {
    label: (label: string) => ({ 'aria-label': label }),
    labelledBy: (id: string) => ({ 'aria-labelledby': id }),
    describedBy: (id: string) => ({ 'aria-describedby': id }),
    expanded: (expanded: boolean) => ({ 'aria-expanded': expanded }),
    selected: (selected: boolean) => ({ 'aria-selected': selected }),
    checked: (checked: boolean) => ({ 'aria-checked': checked }),
    disabled: (disabled: boolean) => ({ 'aria-disabled': disabled }),
    hidden: (hidden: boolean) => ({ 'aria-hidden': hidden }),
    live: (live: 'polite' | 'assertive' | 'off') => ({ 'aria-live': live }),
    atomic: (atomic: boolean) => ({ 'aria-atomic': atomic }),
    busy: (busy: boolean) => ({ 'aria-busy': busy }),
    current: (current: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false') => ({ 'aria-current': current }),
    invalid: (invalid: boolean) => ({ 'aria-invalid': invalid }),
    required: (required: boolean) => ({ 'aria-required': required }),
  },

  // Common ARIA roles
  roles: {
    button: { role: 'button' },
    link: { role: 'link' },
    tab: { role: 'tab' },
    tabpanel: { role: 'tabpanel' },
    tablist: { role: 'tablist' },
    dialog: { role: 'dialog' },
    alertdialog: { role: 'alertdialog' },
    alert: { role: 'alert' },
    status: { role: 'status' },
    progressbar: { role: 'progressbar' },
    slider: { role: 'slider' },
    spinbutton: { role: 'spinbutton' },
    searchbox: { role: 'searchbox' },
    combobox: { role: 'combobox' },
    listbox: { role: 'listbox' },
    option: { role: 'option' },
    menu: { role: 'menu' },
    menuitem: { role: 'menuitem' },
    menubar: { role: 'menubar' },
    navigation: { role: 'navigation' },
    main: { role: 'main' },
    banner: { role: 'banner' },
    contentinfo: { role: 'contentinfo' },
    complementary: { role: 'complementary' },
    region: { role: 'region' },
  },
};

/**
 * Keyboard navigation utilities
 */
export const keyboard = {
  // Key codes
  keys: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
  },

  // Keyboard event handlers
  handlers: {
    onEnterOrSpace: (handler: () => void) => ({
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === keyboard.keys.ENTER || e.key === keyboard.keys.SPACE) {
          e.preventDefault();
          handler();
        }
      },
    }),

    onEscape: (handler: () => void) => ({
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === keyboard.keys.ESCAPE) {
          e.preventDefault();
          handler();
        }
      },
    }),

    onArrowNavigation: (handlers: {
      onUp?: () => void;
      onDown?: () => void;
      onLeft?: () => void;
      onRight?: () => void;
    }) => ({
      onKeyDown: (e: React.KeyboardEvent) => {
        switch (e.key) {
          case keyboard.keys.ARROW_UP:
            e.preventDefault();
            handlers.onUp?.();
            break;
          case keyboard.keys.ARROW_DOWN:
            e.preventDefault();
            handlers.onDown?.();
            break;
          case keyboard.keys.ARROW_LEFT:
            e.preventDefault();
            handlers.onLeft?.();
            break;
          case keyboard.keys.ARROW_RIGHT:
            e.preventDefault();
            handlers.onRight?.();
            break;
        }
      },
    }),
  },
};

/**
 * Focus management utilities
 */
export const focus = {
  // Focus trap for modals and dialogs
  useFocusTrap: (isActive: boolean) => {
    useEffect(() => {
      if (!isActive) return;

      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    }, [isActive]);
  },

  // Focus classes
  classes: {
    visible: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    invisible: 'focus:outline-none',
    within: 'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
  },

  // Focus utilities
  utils: {
    focusElement: (selector: string) => {
      const element = document.querySelector(selector) as HTMLElement;
      element?.focus();
    },
    
    focusFirstError: () => {
      const errorElement = document.querySelector('[aria-invalid="true"]') as HTMLElement;
      errorElement?.focus();
    },

    restoreFocus: (previousElement: HTMLElement | null) => {
      previousElement?.focus();
    },
  },
};

/**
 * Screen reader utilities
 */
export const screenReader = {
  // Screen reader only classes
  classes: {
    only: 'sr-only',
    focusable: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-white p-2 z-50',
  },

  // Live region utilities
  announcements: {
    polite: (message: string) => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    },

    assertive: (message: string) => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    },
  },
};

/**
 * Color contrast utilities
 */
export const colorContrast = {
  // High contrast mode detection
  useHighContrast: () => {
    const [isHighContrast, setIsHighContrast] = useState(false);

    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)');
      setIsHighContrast(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setIsHighContrast(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return isHighContrast;
  },

  // Color classes with good contrast ratios
  classes: {
    text: {
      primary: 'text-gray-900 dark:text-gray-100',
      secondary: 'text-gray-700 dark:text-gray-300',
      muted: 'text-gray-500 dark:text-gray-400',
      error: 'text-red-700 dark:text-red-300',
      success: 'text-green-700 dark:text-green-300',
      warning: 'text-yellow-700 dark:text-yellow-300',
    },
    background: {
      primary: 'bg-white dark:bg-gray-900',
      secondary: 'bg-gray-50 dark:bg-gray-800',
      muted: 'bg-gray-100 dark:bg-gray-700',
      error: 'bg-red-50 dark:bg-red-900',
      success: 'bg-green-50 dark:bg-green-900',
      warning: 'bg-yellow-50 dark:bg-yellow-900',
    },
  },
};

/**
 * Motion and animation preferences
 */
export const motion = {
  // Reduced motion detection
  useReducedMotion: () => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return prefersReducedMotion;
  },

  // Animation classes that respect reduced motion
  classes: {
    transition: 'transition-all duration-200 motion-reduce:transition-none',
    fadeIn: 'animate-in fade-in duration-200 motion-reduce:animate-none',
    slideIn: 'animate-in slide-in-from-bottom-4 duration-200 motion-reduce:animate-none',
    scale: 'transform transition-transform duration-200 hover:scale-105 motion-reduce:transform-none motion-reduce:hover:scale-100',
  },
};

/**
 * Form accessibility utilities
 */
export const formAccessibility = {
  // Form field helpers
  getFieldProps: (id: string, label: string, error?: string, description?: string) => ({
    id,
    'aria-label': label,
    'aria-describedby': description ? `${id}-description` : undefined,
    'aria-invalid': !!error,
    'aria-errormessage': error ? `${id}-error` : undefined,
  }),

  getLabelProps: (htmlFor: string) => ({
    htmlFor,
    className: 'block text-sm font-medium text-gray-700 dark:text-gray-300',
  }),

  getErrorProps: (id: string) => ({
    id: `${id}-error`,
    role: 'alert',
    'aria-live': 'polite' as const,
    className: 'mt-1 text-sm text-red-600 dark:text-red-400',
  }),

  getDescriptionProps: (id: string) => ({
    id: `${id}-description`,
    className: 'mt-1 text-sm text-gray-500 dark:text-gray-400',
  }),
};

/**
 * Table accessibility utilities
 */
export const tableAccessibility = {
  // Table structure helpers
  getTableProps: (caption?: string) => ({
    role: 'table',
    'aria-label': caption,
  }),

  getHeaderProps: (sortable?: boolean, sortDirection?: 'asc' | 'desc') => ({
    role: 'columnheader' as const,
    'aria-sort': sortable ? (sortDirection === 'asc' ? 'ascending' as const : sortDirection === 'desc' ? 'descending' as const : 'none' as const) : undefined,
    tabIndex: sortable ? 0 : undefined,
  }),

  getCellProps: (isHeader?: boolean) => ({
    role: isHeader ? 'rowheader' : 'cell',
  }),

  getRowProps: (selected?: boolean) => ({
    role: 'row',
    'aria-selected': selected,
  }),
};

/**
 * Dialog accessibility utilities
 */
export const dialogAccessibility = {
  getDialogProps: (title: string, describedBy?: string) => ({
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': `${title}-title`,
    'aria-describedby': describedBy,
  }),

  getTitleProps: (title: string) => ({
    id: `${title}-title`,
  }),

  getCloseButtonProps: () => ({
    'aria-label': 'Close dialog',
    type: 'button' as const,
  }),
};

/**
 * Skip links for keyboard navigation
 */
export const skipLinks = {
  // Skip link component props
  getSkipToContentProps: () => ({
    href: "#main-content",
    className: "sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white p-2 z-50 rounded-br",
    children: "Skip to main content"
  }),

  getSkipToNavigationProps: () => ({
    href: "#main-navigation", 
    className: "sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-20 bg-blue-600 text-white p-2 z-50 rounded-br",
    children: "Skip to navigation"
  }),
};

/**
 * Color contrast calculation utilities
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

export const meetsWCAGAA = (color1: string, color2: string): boolean => {
  return getContrastRatio(color1, color2) >= 4.5;
};

export const meetsWCAGAAA = (color1: string, color2: string): boolean => {
  return getContrastRatio(color1, color2) >= 7;
};

/**
 * ARIA label generators
 */
export const getAriaDateLabel = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const getAriaTimeLabel = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const getAriaPercentageLabel = (percentage: number): string => {
  return `${percentage} percent`;
};

export const getAriaStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'active': 'Active status',
    'inactive': 'Inactive status',
    'pending': 'Pending status',
    'completed': 'Completed status',
    'failed': 'Failed status',
    'success': 'Success status',
    'error': 'Error status',
    'warning': 'Warning status'
  };
  return statusMap[status.toLowerCase()] || `${status} status`;
};

export const generateAltText = (context: string, description?: string): string => {
  if (description) {
    return `${context}: ${description}`;
  }
  return context;
};

/**
 * Comprehensive accessibility checker
 */
export const accessibilityChecker = {
  checkElement: (element: HTMLElement) => {
    const issues: string[] = [];

    // Check for missing alt text on images
    const images = element.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push(`Image ${index + 1} is missing alt text`);
      }
    });

    // Check for missing labels on form inputs
    const inputs = element.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
      const hasLabel = input.getAttribute('aria-label') || 
                      input.getAttribute('aria-labelledby') ||
                      element.querySelector(`label[for="${input.id}"]`);
      
      if (!hasLabel) {
        issues.push(`Form input ${index + 1} is missing a label`);
      }
    });

    // Check for proper heading hierarchy
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        issues.push(`Heading ${index + 1} skips levels (h${previousLevel} to h${level})`);
      }
      previousLevel = level;
    });

    // Check for interactive elements without proper roles
    const interactiveElements = element.querySelectorAll('[onclick], [onkeydown]');
    interactiveElements.forEach((el, index) => {
      if (!el.getAttribute('role') && !['button', 'a', 'input', 'select', 'textarea'].includes(el.tagName.toLowerCase())) {
        issues.push(`Interactive element ${index + 1} is missing a role`);
      }
    });

    return issues;
  },
};