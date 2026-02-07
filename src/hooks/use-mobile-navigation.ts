"use client";

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  getClassLevel, 
  getNavigationStyle, 
  triggerHapticFeedback,
  isTouchDevice,
  type ClassLevel,
  type NavigationStyle 
} from '@/lib/utils/mobile-navigation';

interface UseMobileNavigationProps {
  className?: string;
}

export function useMobileNavigation({ className = 'Class 6' }: UseMobileNavigationProps = {}) {
  const pathname = usePathname();
  const [screenWidth, setScreenWidth] = useState(1024); // Default to desktop
  const [isTouch, setIsTouch] = useState(false);
  const [classLevel, setClassLevel] = useState<ClassLevel>('secondary');
  const [navigationStyle, setNavigationStyle] = useState<NavigationStyle>('desktop');

  // Update screen width on resize
  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth);
    };

    // Set initial values
    updateScreenWidth();
    setIsTouch(isTouchDevice());

    window.addEventListener('resize', updateScreenWidth);
    return () => window.removeEventListener('resize', updateScreenWidth);
  }, []);

  // Update class level when className changes
  useEffect(() => {
    setClassLevel(getClassLevel(className));
  }, [className]);

  // Update navigation style when screen width changes
  useEffect(() => {
    setNavigationStyle(getNavigationStyle(screenWidth));
  }, [screenWidth]);

  // Get active navigation item
  const getActiveItem = useCallback(() => {
    if (pathname === '/student') return 'home';
    if (pathname.startsWith('/student/academics') || pathname.startsWith('/student/courses')) return 'learn';
    if (pathname.startsWith('/student/assessments')) return 'tasks';
    if (pathname.startsWith('/student/performance') || pathname.startsWith('/student/attendance')) return 'progress';
    if (pathname.startsWith('/student/communication')) return 'messages';
    if (pathname.startsWith('/student/settings')) return 'settings';
    return null;
  }, [pathname]);

  // Handle navigation with haptic feedback
  const handleNavigation = useCallback((href: string) => {
    if (isTouch) {
      triggerHapticFeedback('light');
    }
    // Navigation will be handled by Next.js Link component
  }, [isTouch]);

  // Check if mobile layout should be used
  const isMobile = navigationStyle === 'mobile';
  const isTablet = navigationStyle === 'tablet';
  const isDesktop = navigationStyle === 'desktop';

  // Check if simplified layout should be used (primary classes)
  const isSimplified = classLevel === 'primary';

  return {
    // State
    screenWidth,
    isTouch,
    classLevel,
    navigationStyle,
    isMobile,
    isTablet,
    isDesktop,
    isSimplified,
    
    // Methods
    getActiveItem,
    handleNavigation,
    
    // Computed values
    activeItem: getActiveItem(),
    shouldShowBottomNav: isMobile,
    shouldShowSidebar: !isMobile,
    maxNavigationItems: isSimplified ? 4 : 6,
  };
}

/**
 * Hook for managing mobile navigation state
 */
export function useNavigationState() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const toggleNavigation = useCallback(() => {
    setIsOpen(prev => !prev);
    if (isTouchDevice()) {
      triggerHapticFeedback('medium');
    }
  }, []);

  const closeNavigation = useCallback(() => {
    setIsOpen(false);
    setActiveSubmenu(null);
  }, []);

  const toggleSubmenu = useCallback((menuId: string) => {
    setActiveSubmenu(prev => prev === menuId ? null : menuId);
    if (isTouchDevice()) {
      triggerHapticFeedback('light');
    }
  }, []);

  return {
    isOpen,
    activeSubmenu,
    toggleNavigation,
    closeNavigation,
    toggleSubmenu,
  };
}

/**
 * Hook for handling swipe gestures on mobile
 */
export function useSwipeNavigation() {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const handleSwipeLeft = useCallback(() => {
    setSwipeDirection('left');
    setTimeout(() => setSwipeDirection(null), 300);
  }, []);

  const handleSwipeRight = useCallback(() => {
    setSwipeDirection('right');
    setTimeout(() => setSwipeDirection(null), 300);
  }, []);

  return {
    swipeDirection,
    handleSwipeLeft,
    handleSwipeRight,
  };
}