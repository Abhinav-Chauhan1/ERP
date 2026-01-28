"use client";

import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";

// Breakpoint utilities
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Hook for responsive behavior
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints | 'xs'>('lg');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= breakpoints['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setBreakpoint('md');
      } else if (width >= breakpoints.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }

      setIsMobile(width < breakpoints.md);
      setIsTablet(width >= breakpoints.md && width < breakpoints.lg);
      setIsDesktop(width >= breakpoints.lg);
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

// Container Component
interface ContainerProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export function Container({ children, size = 'xl', className }: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}>
      {children}
    </div>
  );
}

// Grid System
interface GridProps {
  children: ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export function Grid({ children, cols = { default: 1 }, gap = 4, className }: GridProps) {
  const gridClasses = [
    `grid`,
    `gap-${gap}`,
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(gridClasses, className)}>
      {children}
    </div>
  );
}

// Responsive Sidebar Layout
interface SidebarLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  sidebarWidth?: 'sm' | 'md' | 'lg';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

export function SidebarLayout({
  children,
  sidebar,
  sidebarWidth = 'md',
  collapsible = true,
  defaultCollapsed = false,
  className,
}: SidebarLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isMobile } = useBreakpoint();

  const sidebarWidthClasses = {
    sm: 'w-64',
    md: 'w-72',
    lg: 'w-80',
  };

  const collapsedWidth = 'w-16';

  if (isMobile) {
    return (
      <div className={cn('flex h-screen bg-background', className)}>
        {/* Mobile Menu Button */}
        <div className="fixed top-4 left-4 z-50 lg:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              {sidebar}
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="pt-16 px-4">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={cn('flex h-screen bg-background', className)}>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'flex-shrink-0 border-r bg-card transition-all duration-300',
          isCollapsed ? collapsedWidth : sidebarWidthClasses[sidebarWidth]
        )}
      >
        <div className="flex h-full flex-col">
          {/* Collapse Toggle */}
          {collapsible && (
            <div className="flex justify-end p-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Button>
            </div>
          )}
          
          {/* Sidebar Content */}
          <div className={cn('flex-1 overflow-auto', isCollapsed && 'px-2')}>
            {sidebar}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

// Stack Component for vertical layouts
interface StackProps {
  children: ReactNode;
  spacing?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

export function Stack({ children, spacing = 4, align = 'stretch', className }: StackProps) {
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  return (
    <div className={cn('flex flex-col', `gap-${spacing}`, alignClasses[align], className)}>
      {children}
    </div>
  );
}

// Inline Component for horizontal layouts
interface InlineProps {
  children: ReactNode;
  spacing?: number;
  align?: 'start' | 'center' | 'end' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
}

export function Inline({ 
  children, 
  spacing = 4, 
  align = 'center', 
  justify = 'start',
  wrap = false,
  className 
}: InlineProps) {
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    baseline: 'items-baseline',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  return (
    <div className={cn(
      'flex',
      `gap-${spacing}`,
      alignClasses[align],
      justifyClasses[justify],
      wrap && 'flex-wrap',
      className
    )}>
      {children}
    </div>
  );
}

// Responsive Show/Hide Components
interface ShowProps {
  children: ReactNode;
  above?: keyof typeof breakpoints;
  below?: keyof typeof breakpoints;
  only?: keyof typeof breakpoints | 'xs';
}

export function Show({ children, above, below, only }: ShowProps) {
  const { breakpoint } = useBreakpoint();
  
  if (only) {
    return breakpoint === only ? <>{children}</> : null;
  }

  if (above && below) {
    const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const aboveWidth = breakpoints[above];
    const belowWidth = breakpoints[below];
    return currentWidth >= aboveWidth && currentWidth < belowWidth ? <>{children}</> : null;
  }

  if (above) {
    const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    return currentWidth >= breakpoints[above] ? <>{children}</> : null;
  }

  if (below) {
    const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    return currentWidth < breakpoints[below] ? <>{children}</> : null;
  }

  return <>{children}</>;
}

export function Hide({ children, above, below, only }: ShowProps) {
  const { breakpoint } = useBreakpoint();
  
  if (only) {
    return breakpoint !== only ? <>{children}</> : null;
  }

  if (above && below) {
    const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const aboveWidth = breakpoints[above];
    const belowWidth = breakpoints[below];
    return !(currentWidth >= aboveWidth && currentWidth < belowWidth) ? <>{children}</> : null;
  }

  if (above) {
    const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    return currentWidth < breakpoints[above] ? <>{children}</> : null;
  }

  if (below) {
    const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    return currentWidth >= breakpoints[below] ? <>{children}</> : null;
  }

  return null;
}

// Aspect Ratio Container
interface AspectRatioProps {
  children: ReactNode;
  ratio?: number; // width/height ratio
  className?: string;
}

export function AspectRatio({ children, ratio = 16/9, className }: AspectRatioProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <div 
        className="w-full"
        style={{ paddingBottom: `${(1 / ratio) * 100}%` }}
      />
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}

// Responsive Text
interface ResponsiveTextProps {
  children: ReactNode;
  size?: {
    base?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  className?: string;
}

export function ResponsiveText({ children, size = {}, className }: ResponsiveTextProps) {
  const sizeClasses = [
    size.base,
    size.sm && `sm:${size.sm}`,
    size.md && `md:${size.md}`,
    size.lg && `lg:${size.lg}`,
    size.xl && `xl:${size.xl}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(sizeClasses, className)}>
      {children}
    </div>
  );
}