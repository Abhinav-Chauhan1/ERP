import { Suspense, ReactNode } from 'react';

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback: ReactNode;
}

/**
 * Reusable Suspense wrapper component that prevents layout shifts
 * by showing a fallback UI while content is loading
 */
export function SuspenseWrapper({ children, fallback }: SuspenseWrapperProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
