"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";

// Design System Color Palette
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    900: '#7f1d1d',
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
} as const;

// Typography Scale
export const typography = {
  display: {
    large: 'text-5xl font-bold tracking-tight',
    medium: 'text-4xl font-bold tracking-tight',
    small: 'text-3xl font-bold tracking-tight',
  },
  heading: {
    h1: 'text-2xl font-semibold tracking-tight',
    h2: 'text-xl font-semibold tracking-tight',
    h3: 'text-lg font-semibold tracking-tight',
    h4: 'text-base font-semibold tracking-tight',
  },
  body: {
    large: 'text-base',
    medium: 'text-sm',
    small: 'text-xs',
  },
  label: {
    large: 'text-sm font-medium',
    medium: 'text-xs font-medium',
    small: 'text-xs font-medium uppercase tracking-wide',
  }
} as const;

// Spacing Scale
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
} as const;

// Status Indicator Component
interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  children: ReactNode;
  className?: string;
}

export function StatusIndicator({ 
  status, 
  size = 'md', 
  showIcon = true, 
  children, 
  className 
}: StatusIndicatorProps) {
  const statusConfig = {
    success: {
      color: 'text-green-700 bg-green-50 border-green-200',
      icon: CheckCircle,
    },
    warning: {
      color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      icon: AlertTriangle,
    },
    error: {
      color: 'text-red-700 bg-red-50 border-red-200',
      icon: XCircle,
    },
    info: {
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      icon: Info,
    },
    neutral: {
      color: 'text-gray-700 bg-gray-50 border-gray-200',
      icon: Info,
    },
  };

  const sizeConfig = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      'inline-flex items-center gap-2 rounded-md border',
      config.color,
      sizeConfig[size],
      className
    )}>
      {showIcon && <Icon className="h-4 w-4 flex-shrink-0" />}
      {children}
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period?: string;
  };
  icon?: ReactNode;
  description?: string;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  description, 
  className 
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!change) return null;
    
    switch (change.type) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    if (!change) return 'text-gray-600';
    
    switch (change.type) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className={cn('transition-all hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className={cn('flex items-center gap-1 text-xs', getTrendColor())}>
            {getTrendIcon()}
            <span>
              {change.value > 0 ? '+' : ''}{change.value}%
              {change.period && ` from ${change.period}`}
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Loading States
interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingState({ 
  type = 'spinner', 
  size = 'md', 
  text, 
  className 
}: LoadingStateProps) {
  const sizeConfig = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  if (type === 'spinner') {
    return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
        <Loader2 className={cn('animate-spin', sizeConfig[size])} />
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  if (type === 'skeleton') {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div className={cn('animate-pulse bg-gray-200 rounded', className)} />
    );
  }

  return null;
}

// Empty State Component
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-600 mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Error Boundary Component
interface ErrorBoundaryProps {
  error?: Error;
  reset?: () => void;
  className?: string;
}

export function ErrorBoundary({ error, reset, className }: ErrorBoundaryProps) {
  return (
    <div className={cn('p-6', className)}>
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="mt-2">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </AlertDescription>
        {reset && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={reset}
            className="mt-4"
          >
            Try again
          </Button>
        )}
      </Alert>
    </div>
  );
}

// Data Table Skeleton
export function DataTableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  );
}

// Progress Indicator
interface ProgressIndicatorProps {
  steps: Array<{
    label: string;
    status: 'completed' | 'current' | 'upcoming';
  }>;
  className?: string;
}

export function ProgressIndicator({ steps, className }: ProgressIndicatorProps) {
  return (
    <nav className={cn('flex items-center justify-center', className)} aria-label="Progress">
      <ol className="flex items-center space-x-5">
        {steps.map((step, stepIdx) => (
          <li key={step.label}>
            <div className="flex items-center">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2',
                step.status === 'completed' 
                  ? 'border-primary bg-primary text-primary-foreground'
                  : step.status === 'current'
                  ? 'border-primary bg-background text-primary'
                  : 'border-gray-300 bg-background text-gray-500'
              )}>
                {step.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{stepIdx + 1}</span>
                )}
              </div>
              <span className={cn(
                'ml-2 text-sm font-medium',
                step.status === 'current' ? 'text-primary' : 'text-gray-500'
              )}>
                {step.label}
              </span>
              {stepIdx < steps.length - 1 && (
                <div className="ml-5 h-0.5 w-16 bg-gray-300" />
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Notification Toast (would typically use a toast library)
interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export function Notification({ 
  type, 
  title, 
  message, 
  onClose, 
  className 
}: NotificationProps) {
  const config = {
    success: {
      color: 'border-green-200 bg-green-50 text-green-800',
      icon: CheckCircle,
    },
    error: {
      color: 'border-red-200 bg-red-50 text-red-800',
      icon: XCircle,
    },
    warning: {
      color: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      icon: AlertTriangle,
    },
    info: {
      color: 'border-blue-200 bg-blue-50 text-blue-800',
      icon: Info,
    },
  };

  const { color, icon: Icon } = config[type];

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-lg border p-4',
      color,
      className
    )}>
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-medium">{title}</h4>
        {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
      </div>
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 hover:bg-black/10"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Export all design tokens
export const designTokens = {
  colors,
  typography,
  spacing,
} as const;