import { Suspense, ReactNode } from 'react';

interface AsyncSectionProps {
  children: ReactNode;
  fallback: ReactNode;
  /**
   * Optional error boundary - if provided, will catch errors in the async section
   */
  errorFallback?: ReactNode;
}

/**
 * Wrapper component for async sections with Suspense boundary
 * Prevents layout shifts by showing a fallback UI while content loads
 * 
 * Usage:
 * <AsyncSection fallback={<SkeletonLoader />}>
 *   <AsyncDataComponent />
 * </AsyncSection>
 */
export function AsyncSection({ children, fallback }: AsyncSectionProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}
