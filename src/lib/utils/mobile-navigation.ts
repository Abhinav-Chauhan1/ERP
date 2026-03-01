/**
 * Mobile-First Navigation Utilities
 * Handles class-based design variations and mobile-specific navigation logic
 */

export type ClassLevel = 'primary' | 'secondary';
export type NavigationStyle = 'mobile' | 'tablet' | 'desktop';

/**
 * Determines class level based on class number
 */
export function getClassLevel(className: string): ClassLevel {
  // Extract class number from class name (e.g., "Class 5" -> 5)
  const classNumber = parseInt(className.match(/\d+/)?.[0] || '0');
  return classNumber <= 5 ? 'primary' : 'secondary';
}

/**
 * Gets navigation style based on screen width
 */
export function getNavigationStyle(width: number): NavigationStyle {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Mobile-first touch target sizes
 */
export const TOUCH_TARGETS = {
  primary: {
    mobile: 'min-h-[60px] min-w-[60px]',
    tablet: 'min-h-[56px] min-w-[56px]',
    desktop: 'min-h-[52px] min-w-[52px]'
  },
  secondary: {
    mobile: 'min-h-[44px] min-w-[44px]',
    tablet: 'min-h-[44px] min-w-[44px]',
    desktop: 'min-h-[40px] min-w-[40px]'
  }
} as const;

/**
 * Class-based color schemes
 */
export const COLOR_SCHEMES = {
  primary: {
    home: 'bg-blue-500 hover:bg-blue-600 text-white',
    learn: 'bg-green-500 hover:bg-green-600 text-white',
    tasks: 'bg-orange-500 hover:bg-orange-600 text-white',
    progress: 'bg-teal-500 hover:bg-teal-600 text-white',
    messages: 'bg-pink-500 hover:bg-pink-600 text-white',
    settings: 'bg-gray-500 hover:bg-gray-600 text-white'
  },
  secondary: {
    home: 'bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100',
    learn: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:hover:bg-emerald-800 dark:text-emerald-100',
    tasks: 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-900 dark:hover:bg-amber-800 dark:text-amber-100',
    progress: 'bg-violet-100 hover:bg-violet-200 text-violet-900 dark:bg-violet-900 dark:hover:bg-violet-800 dark:text-violet-100',
    messages: 'bg-rose-100 hover:bg-rose-200 text-rose-900 dark:bg-rose-900 dark:hover:bg-rose-800 dark:text-rose-100',
    settings: 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100'
  }
} as const;

/**
 * Typography scales for different class levels
 */
export const TYPOGRAPHY = {
  primary: {
    mobile: 'text-lg font-bold',
    tablet: 'text-base font-bold',
    desktop: 'text-sm font-bold'
  },
  secondary: {
    mobile: 'text-base font-medium',
    tablet: 'text-sm font-medium',
    desktop: 'text-sm font-medium'
  }
} as const;

/**
 * Icon sizes for different class levels and screen sizes
 */
export const ICON_SIZES = {
  primary: {
    mobile: 'h-8 w-8',
    tablet: 'h-7 w-7',
    desktop: 'h-6 w-6'
  },
  secondary: {
    mobile: 'h-6 w-6',
    tablet: 'h-5 w-5',
    desktop: 'h-5 w-5'
  }
} as const;

/**
 * Navigation items configuration
 */
export const NAVIGATION_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    href: '/student',
    icon: 'Home',
    description: 'Dashboard and overview'
  },
  {
    id: 'learn',
    label: 'Learn',
    href: '/student/academics',
    icon: 'BookOpen',
    description: 'Classes and subjects'
  },
  {
    id: 'tasks',
    label: 'Tasks',
    href: '/student/assessments',
    icon: 'CheckSquare',
    description: 'Assignments and exams'
  },
  {
    id: 'progress',
    label: 'Progress',
    href: '/student/performance',
    icon: 'TrendingUp',
    description: 'Grades and achievements'
  },
  {
    id: 'messages',
    label: 'Messages',
    href: '/student/communication',
    icon: 'MessageCircle',
    description: 'Chat and announcements'
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/student/settings',
    icon: 'Settings',
    description: 'Account and preferences'
  }
] as const;

/**
 * Gets appropriate classes for navigation item
 */
export function getNavigationItemClasses(
  itemId: string,
  classLevel: ClassLevel,
  navigationStyle: NavigationStyle,
  isActive: boolean = false
): string {
  const touchTarget = TOUCH_TARGETS[classLevel][navigationStyle];
  const colorScheme = COLOR_SCHEMES[classLevel][itemId as keyof typeof COLOR_SCHEMES.primary];
  const typography = TYPOGRAPHY[classLevel][navigationStyle];
  
  const baseClasses = `
    ${touchTarget}
    ${colorScheme}
    ${typography}
    flex flex-col items-center justify-center
    rounded-lg transition-all duration-200
    active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2
    ${classLevel === 'primary' ? 'shadow-lg' : 'border border-opacity-20'}
  `.trim().replace(/\s+/g, ' ');

  const activeClasses = isActive ? 'ring-2 ring-offset-2 ring-blue-500' : '';
  
  return `${baseClasses} ${activeClasses}`.trim();
}

/**
 * Gets icon size classes
 */
export function getIconClasses(
  classLevel: ClassLevel,
  navigationStyle: NavigationStyle
): string {
  return ICON_SIZES[classLevel][navigationStyle];
}

/**
 * Haptic feedback for mobile interactions
 */
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    navigator.vibrate(patterns[type]);
  }
}

/**
 * Detects if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Gets swipe gesture handlers
 */
export function getSwipeHandlers(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold: number = 50
) {
  let startX = 0;
  let startY = 0;

  return {
    onTouchStart: (e: React.TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
          triggerHapticFeedback('light');
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
          triggerHapticFeedback('light');
        }
      }
      
      startX = 0;
      startY = 0;
    }
  };
}