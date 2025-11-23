/**
 * Accessibility Utilities
 * 
 * Provides utilities for ensuring WCAG 2.1 AA compliance
 * and improving accessibility throughout the application.
 */

/**
 * Calculate relative luminance of a color
 * Used for contrast ratio calculations
 * 
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Relative luminance value
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Convert hex color to RGB
 * 
 * @param hex - Hex color string (e.g., "#ffffff")
 * @returns RGB object or null if invalid
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate contrast ratio between two colors
 * 
 * WCAG 2.1 requires:
 * - AA: 4.5:1 for normal text, 3:1 for large text
 * - AAA: 7:1 for normal text, 4.5:1 for large text
 * 
 * @param color1 - First color (hex)
 * @param color2 - Second color (hex)
 * @returns Contrast ratio
 * 
 * @see Requirements 5.3 - Color contrast compliance
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Use hex colors (e.g., #ffffff)');
  }

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG 2.1 AA standards
 * 
 * @param color1 - Foreground color (hex)
 * @param color2 - Background color (hex)
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Whether contrast meets AA standards
 * 
 * @see Requirements 5.3 - WCAG 2.1 AA contrast ratios
 */
export function meetsWCAGAA(
  color1: string,
  color2: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(color1, color2);
  const minimumRatio = isLargeText ? 3 : 4.5;
  return ratio >= minimumRatio;
}

/**
 * Check if contrast ratio meets WCAG 2.1 AAA standards
 * 
 * @param color1 - Foreground color (hex)
 * @param color2 - Background color (hex)
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Whether contrast meets AAA standards
 */
export function meetsWCAGAAA(
  color1: string,
  color2: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(color1, color2);
  const minimumRatio = isLargeText ? 4.5 : 7;
  return ratio >= minimumRatio;
}

/**
 * Generate ARIA label for a date
 * 
 * @param date - Date object
 * @returns Human-readable date string
 */
export function getAriaDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate ARIA label for a time
 * 
 * @param date - Date object
 * @returns Human-readable time string
 */
export function getAriaTimeLabel(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Generate ARIA label for a percentage
 * 
 * @param value - Percentage value (0-100)
 * @returns Human-readable percentage string
 */
export function getAriaPercentageLabel(value: number): string {
  return `${value} percent`;
}

/**
 * Generate ARIA label for a status
 * 
 * @param status - Status string
 * @returns Human-readable status string
 */
export function getAriaStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase();
}

/**
 * Announce message to screen readers
 * Uses ARIA live region to announce dynamic content changes
 * 
 * @param message - Message to announce
 * @param priority - Priority level ('polite' or 'assertive')
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if element is keyboard accessible
 * 
 * @param element - HTML element to check
 * @returns Whether element is keyboard accessible
 */
export function isKeyboardAccessible(element: HTMLElement): boolean {
  const tabIndex = element.getAttribute('tabindex');
  const isInteractive =
    element.tagName === 'A' ||
    element.tagName === 'BUTTON' ||
    element.tagName === 'INPUT' ||
    element.tagName === 'SELECT' ||
    element.tagName === 'TEXTAREA' ||
    element.getAttribute('role') === 'button' ||
    element.getAttribute('role') === 'link';

  return isInteractive || (tabIndex !== null && tabIndex !== '-1');
}

/**
 * Trap focus within a container (useful for modals)
 * 
 * @param container - Container element
 * @returns Cleanup function
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
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

  container.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Generate descriptive alt text for common image types
 * 
 * @param imageType - Type of image
 * @param context - Additional context
 * @returns Alt text string
 * 
 * @see Requirements 5.5 - Descriptive alt text
 */
export function generateAltText(
  imageType: 'profile' | 'document' | 'chart' | 'logo' | 'icon',
  context?: string
): string {
  const templates = {
    profile: context ? `Profile photo of ${context}` : 'Profile photo',
    document: context ? `Document: ${context}` : 'Document',
    chart: context ? `Chart showing ${context}` : 'Data visualization chart',
    logo: context ? `${context} logo` : 'Logo',
    icon: context ? `${context} icon` : 'Icon',
  };

  return templates[imageType];
}

/**
 * Validate ARIA attributes on an element
 * 
 * @param element - HTML element to validate
 * @returns Validation result with any issues
 */
export function validateAriaAttributes(element: HTMLElement): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for required ARIA attributes based on role
  const role = element.getAttribute('role');
  if (role) {
    switch (role) {
      case 'button':
        if (!element.hasAttribute('aria-label') && !element.textContent?.trim()) {
          issues.push('Button role requires aria-label or text content');
        }
        break;
      case 'img':
        if (!element.hasAttribute('aria-label')) {
          issues.push('Image role requires aria-label');
        }
        break;
      case 'dialog':
        if (!element.hasAttribute('aria-labelledby') && !element.hasAttribute('aria-label')) {
          issues.push('Dialog role requires aria-labelledby or aria-label');
        }
        break;
    }
  }

  // Check for invalid ARIA attribute combinations
  if (element.hasAttribute('aria-hidden') && element.getAttribute('aria-hidden') === 'true') {
    if (isKeyboardAccessible(element)) {
      issues.push('Element is aria-hidden but keyboard accessible');
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
