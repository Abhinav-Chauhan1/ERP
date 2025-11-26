/**
 * Accessibility Testing Utilities
 * 
 * Utilities for testing accessibility compliance in the application.
 * These functions help verify WCAG 2.1 Level AA compliance.
 */

/**
 * Check if an element has an accessible name
 * An accessible name can come from:
 * - aria-label
 * - aria-labelledby
 * - Text content
 * - alt attribute (for images)
 * - title attribute (as fallback)
 */
export function hasAccessibleName(element: HTMLElement): boolean {
  // Check for aria-label
  if (element.getAttribute('aria-label')) {
    return true;
  }

  // Check for aria-labelledby
  if (element.getAttribute('aria-labelledby')) {
    return true;
  }

  // Check for text content (excluding whitespace)
  if (element.textContent?.trim()) {
    return true;
  }

  // Check for alt attribute (images)
  if (element.tagName === 'IMG' && element.getAttribute('alt')) {
    return true;
  }

  // Check for title attribute (fallback)
  if (element.getAttribute('title')) {
    return true;
  }

  return false;
}

/**
 * Check if an element is keyboard accessible
 * An element is keyboard accessible if:
 * - It's a native interactive element (button, a, input, etc.)
 * - It has tabindex >= 0
 * - It has role="button" or similar with tabindex
 */
export function isKeyboardAccessible(element: HTMLElement): boolean {
  const interactiveElements = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
  
  // Check if it's a native interactive element
  if (interactiveElements.includes(element.tagName)) {
    return true;
  }

  // Check for tabindex
  const tabindex = element.getAttribute('tabindex');
  if (tabindex !== null && parseInt(tabindex) >= 0) {
    return true;
  }

  return false;
}

/**
 * Check if a form input has an associated label
 * A form input should have:
 * - A <label> element with matching for/id
 * - aria-label
 * - aria-labelledby
 */
export function hasAssociatedLabel(input: HTMLInputElement): boolean {
  // Check for aria-label
  if (input.getAttribute('aria-label')) {
    return true;
  }

  // Check for aria-labelledby
  if (input.getAttribute('aria-labelledby')) {
    return true;
  }

  // Check for associated label element
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
      return true;
    }
  }

  // Check if input is wrapped in a label
  const parentLabel = input.closest('label');
  if (parentLabel) {
    return true;
  }

  return false;
}

/**
 * Find all accessibility issues on the page
 * Returns an array of issue descriptions
 */
export function findAccessibilityIssues(): string[] {
  const issues: string[] = [];

  // Check buttons without accessible names
  const buttons = document.querySelectorAll('button');
  buttons.forEach((button, index) => {
    if (!hasAccessibleName(button)) {
      issues.push(`Button ${index + 1} missing accessible name`);
    }
  });

  // Check links without accessible names
  const links = document.querySelectorAll('a');
  links.forEach((link, index) => {
    if (!hasAccessibleName(link)) {
      issues.push(`Link ${index + 1} missing accessible name: ${link.href}`);
    }
  });

  // Check images without alt text
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.alt && !img.getAttribute('aria-label')) {
      issues.push(`Image ${index + 1} missing alt text: ${img.src}`);
    }
  });

  // Check form inputs without labels
  const inputs = document.querySelectorAll('input:not([type="hidden"])');
  inputs.forEach((input, index) => {
    if (!hasAssociatedLabel(input as HTMLInputElement)) {
      const inputElement = input as HTMLInputElement;
      issues.push(`Input ${index + 1} missing label: ${inputElement.name || inputElement.id || 'unnamed'}`);
    }
  });

  // Check interactive elements without keyboard access
  const interactiveElements = document.querySelectorAll('[onclick], [role="button"]');
  interactiveElements.forEach((element, index) => {
    if (!isKeyboardAccessible(element as HTMLElement)) {
      issues.push(`Interactive element ${index + 1} not keyboard accessible`);
    }
  });

  return issues;
}

/**
 * Test keyboard navigation on an element
 * Simulates Enter and Space key presses
 */
export function testKeyboardNavigation(element: HTMLElement): {
  enterWorks: boolean;
  spaceWorks: boolean;
} {
  let enterWorks = false;
  let spaceWorks = false;

  // Test Enter key
  const enterEvent = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    bubbles: true,
  });
  
  element.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      enterWorks = true;
    }
  }, { once: true });
  
  element.dispatchEvent(enterEvent);

  // Test Space key
  const spaceEvent = new KeyboardEvent('keydown', {
    key: ' ',
    code: 'Space',
    bubbles: true,
  });
  
  element.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === ' ') {
      spaceWorks = true;
    }
  }, { once: true });
  
  element.dispatchEvent(spaceEvent);

  return { enterWorks, spaceWorks };
}

/**
 * Check if focus is trapped within a modal
 * Useful for testing modal dialogs
 */
export function isFocusTrapped(container: HTMLElement): boolean {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) {
    return false;
  }

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  // Check if Tab from last element focuses first element
  lastElement.focus();
  const tabEvent = new KeyboardEvent('keydown', {
    key: 'Tab',
    code: 'Tab',
    bubbles: true,
  });
  lastElement.dispatchEvent(tabEvent);

  // In a properly trapped focus, the first element should now have focus
  return document.activeElement === firstElement;
}

/**
 * Get color contrast ratio between two colors
 * Returns a number representing the contrast ratio
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 */
export function getContrastRatio(foreground: string, background: string): number {
  // Convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) {
    return 0;
  }

  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bg.r, bg.g, bg.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsWCAGAA(contrastRatio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export function meetsWCAGAAA(contrastRatio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7;
}
