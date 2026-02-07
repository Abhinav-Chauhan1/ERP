"use client";

import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { MobileNavigationItem, SimplifiedNavigationItem } from './mobile-navigation-item';
import { NAVIGATION_ITEMS } from '@/lib/utils/mobile-navigation';
import { getSwipeHandlers } from '@/lib/utils/mobile-navigation';
import { useSwipeNavigation } from '@/hooks/use-mobile-navigation';

interface MobileBottomNavigationProps {
  className?: string;
}

export function MobileBottomNavigation({ className }: MobileBottomNavigationProps) {
  const {
    classLevel,
    navigationStyle,
    activeItem,
    handleNavigation,
    isSimplified,
    maxNavigationItems,
    isMobile
  } = useMobileNavigation({ className });

  const { handleSwipeLeft, handleSwipeRight } = useSwipeNavigation();
  
  // Only show on mobile
  if (!isMobile) return null;

  // Get navigation items based on class level
  const navigationItems = NAVIGATION_ITEMS.slice(0, maxNavigationItems);

  // Swipe handlers for navigation
  const swipeHandlers = getSwipeHandlers(handleSwipeLeft, handleSwipeRight);

  if (isSimplified) {
    // Simplified layout for primary classes (1-5)
    return (
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-pb"
        {...swipeHandlers}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="grid grid-cols-2 gap-4 p-4 max-w-sm mx-auto">
          {navigationItems.map((item) => (
            <SimplifiedNavigationItem
              key={item.id}
              id={item.id}
              label={item.label}
              href={item.href}
              icon={item.icon as any}
              isActive={activeItem === item.id}
              onClick={() => handleNavigation(item.href)}
            />
          ))}
        </div>
      </nav>
    );
  }

  // Standard layout for secondary classes (6-12)
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-pb"
      {...swipeHandlers}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="grid grid-cols-6 gap-1 px-2 py-2">
        {navigationItems.map((item) => (
          <MobileNavigationItem
            key={item.id}
            id={item.id}
            label={item.label}
            href={item.href}
            icon={item.icon as any}
            description={item.description}
            isActive={activeItem === item.id}
            classLevel={classLevel}
            navigationStyle={navigationStyle}
            onClick={() => handleNavigation(item.href)}
            showLabel={true}
          />
        ))}
      </div>
    </nav>
  );
}

/**
 * Spacer component to prevent content from being hidden behind bottom navigation
 */
export function MobileBottomNavigationSpacer({ className }: { className?: string }) {
  const { isMobile, isSimplified } = useMobileNavigation({ className });
  
  if (!isMobile) return null;
  
  return (
    <div 
      className={`
        ${isSimplified ? 'h-32' : 'h-20'} 
        w-full flex-shrink-0
      `} 
      aria-hidden="true"
    />
  );
}