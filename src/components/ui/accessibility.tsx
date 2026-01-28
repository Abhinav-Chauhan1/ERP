"use client";

import { ReactNode, useEffect, useRef, useState, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

// Skip Link Component
interface SkipLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50',
        'bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      {children}
    </a>
  );
}

// Screen Reader Only Text
interface ScreenReaderOnlyProps {
  children: ReactNode;
  className?: string;
}

export function ScreenReaderOnly({ children, className }: ScreenReaderOnlyProps) {
  return (
    <span className={cn('sr-only', className)}>
      {children}
    </span>
  );
}

// Focus Trap Component
interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export function FocusTrap({ 
  children, 
  active = true, 
  restoreFocus = true, 
  className 
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    container.addEventListener('keydown', handleKeyDown as any);

    return () => {
      container.removeEventListener('keydown', handleKeyDown as any);
      
      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, restoreFocus]);

  if (!active) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Announcement Component for Screen Readers
interface AnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export function Announcement({ message, priority = 'polite', className }: AnnouncementProps) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {message}
    </div>
  );
}

// Live Region Hook
export function useLiveRegion() {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  const announce = (text: string, urgency: 'polite' | 'assertive' = 'polite') => {
    setMessage(''); // Clear first to ensure the message is announced
    setTimeout(() => {
      setMessage(text);
      setPriority(urgency);
    }, 100);
  };

  const LiveRegion = () => (
    <Announcement message={message} priority={priority} />
  );

  return { announce, LiveRegion };
}

// Keyboard Navigation Hook
export function useKeyboardNavigation(
  items: string[],
  onSelect?: (item: string, index: number) => void
) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev <= 0 ? items.length - 1 : prev - 1);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0 && onSelect) {
          onSelect(items[activeIndex], activeIndex);
        }
        break;
      case 'Escape':
        setActiveIndex(-1);
        break;
    }
  };

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
  };
}

// Accessible Button with Loading State
interface AccessibleButtonProps {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function AccessibleButton({
  children,
  loading = false,
  loadingText = 'Loading...',
  disabled = false,
  onClick,
  variant = 'default',
  size = 'default',
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: AccessibleButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      aria-label={loading ? loadingText : ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
    >
      {loading ? loadingText : children}
    </Button>
  );
}

// Form Field with Accessibility Features
interface AccessibleFieldProps {
  children: ReactNode;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  className?: string;
}

export function AccessibleField({
  children,
  label,
  error,
  description,
  required = false,
  className,
}: AccessibleFieldProps) {
  const fieldId = `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const descriptionId = description ? `${fieldId}-description` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={fieldId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <div
        id={fieldId}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? 'true' : 'false'}
        aria-required={required}
      >
        {children}
      </div>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          <AlertTriangle className="inline h-4 w-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}

// Status Message Component
interface StatusMessageProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function StatusMessage({
  type,
  title,
  children,
  dismissible = false,
  onDismiss,
  className,
}: StatusMessageProps) {
  const config = {
    info: {
      icon: Info,
      className: 'bg-blue-50 border-blue-200 text-blue-800',
      role: 'status' as const,
    },
    success: {
      icon: CheckCircle,
      className: 'bg-green-50 border-green-200 text-green-800',
      role: 'status' as const,
    },
    warning: {
      icon: AlertTriangle,
      className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      role: 'alert' as const,
    },
    error: {
      icon: XCircle,
      className: 'bg-red-50 border-red-200 text-red-800',
      role: 'alert' as const,
    },
  };

  const { icon: Icon, className: typeClassName, role } = config[type];

  return (
    <div
      role={role}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        typeClassName,
        className
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        {title && (
          <h3 className="font-medium mb-1">{title}</h3>
        )}
        <div className="text-sm">{children}</div>
      </div>
      {dismissible && onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-6 w-6 p-0 hover:bg-black/10"
          aria-label="Dismiss message"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// High Contrast Mode Detection
export function useHighContrastMode() {
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
}

// Reduced Motion Detection
export function useReducedMotion() {
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
}

// Accessible Data Table
interface AccessibleTableProps {
  caption: string;
  headers: string[];
  data: Array<Record<string, any>>;
  className?: string;
}

export function AccessibleTable({ caption, headers, data, className }: AccessibleTableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse" role="table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="border-b border-border px-4 py-2 text-left font-medium"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border">
              {headers.map((header, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-2"
                  {...(cellIndex === 0 && { scope: 'row' })}
                >
                  {row[header.toLowerCase().replace(/\s+/g, '_')]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Tooltip with Accessibility
interface AccessibleTooltipProps {
  children: ReactNode;
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function AccessibleTooltip({ 
  children, 
  content, 
  side = 'top', 
  className 
}: AccessibleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-describedby={isVisible ? tooltipId : undefined}
      >
        {children}
      </div>
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            'absolute z-50 px-2 py-1 text-xs bg-popover text-popover-foreground border rounded shadow-md',
            side === 'top' && 'bottom-full left-1/2 transform -translate-x-1/2 mb-1',
            side === 'right' && 'left-full top-1/2 transform -translate-y-1/2 ml-1',
            side === 'bottom' && 'top-full left-1/2 transform -translate-x-1/2 mt-1',
            side === 'left' && 'right-full top-1/2 transform -translate-y-1/2 mr-1',
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}