"use client";

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useMobileNavigation, useNavigationState } from '@/hooks/use-mobile-navigation';
import { MobileNavigationItem } from './mobile-navigation-item';
import { NAVIGATION_ITEMS } from '@/lib/utils/mobile-navigation';
import { Button } from '@/components/ui/button';

interface ResponsiveSidebarNavigationProps {
  className?: string;
  schoolName?: string | null;
  schoolLogo?: string | null;
}


export function ResponsiveSidebarNavigation({ className, schoolName, schoolLogo }: ResponsiveSidebarNavigationProps) {
  const {
    classLevel,
    navigationStyle,
    activeItem,
    handleNavigation,
    isSimplified,
    maxNavigationItems,
    shouldShowSidebar,
    isMobile
  } = useMobileNavigation({ className });

  const { isOpen, toggleNavigation, closeNavigation } = useNavigationState();

  // Don't show sidebar on mobile (use bottom nav instead)
  if (isMobile) return null;

  const navigationItems = NAVIGATION_ITEMS.slice(0, maxNavigationItems);

  return (
    <>
      {/* Mobile menu button (for tablet) */}
      {!shouldShowSidebar && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleNavigation}
          className="fixed top-4 left-4 z-50 md:hidden"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${shouldShowSidebar ? 'block' : 'hidden md:block'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed left-0 top-0 z-40 h-full w-64 
          bg-white dark:bg-gray-900 
          border-r border-gray-200 dark:border-gray-700
          transition-transform duration-300 ease-in-out
          overflow-y-auto
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {schoolLogo && (
              <img
                src={schoolLogo}
                alt={`${schoolName || 'School'} logo`}
                className="h-10 w-10 object-contain flex-shrink-0"
              />
            )}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {schoolName || "Student Portal"}
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isSimplified ? 'Simple Mode' : 'Full Features'}
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="p-4">
          {isSimplified ? (
            // Simplified grid layout for primary classes
            <div className="grid grid-cols-2 gap-4">
              {navigationItems.map((item) => (
                <MobileNavigationItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  href={item.href}
                  icon={item.icon as any}
                  isActive={activeItem === item.id}
                  classLevel={classLevel}
                  navigationStyle={navigationStyle}
                  onClick={() => {
                    handleNavigation(item.href);
                    closeNavigation();
                  }}
                />
              ))}
            </div>
          ) : (
            // Vertical list for secondary classes
            <div className="space-y-2">
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
                  onClick={() => {
                    handleNavigation(item.href);
                    closeNavigation();
                  }}
                />
              ))}
            </div>
          )}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && !shouldShowSidebar && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={closeNavigation}
          aria-hidden="true"
        />
      )}
    </>
  );
}

/**
 * Content wrapper that adjusts for sidebar
 */
export function SidebarContentWrapper({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { shouldShowSidebar } = useMobileNavigation({ className });

  return (
    <main
      className={`
        ${shouldShowSidebar ? 'md:ml-64' : ''}
        min-h-screen transition-all duration-300
      `}
    >
      {children}
    </main>
  );
}