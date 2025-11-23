/**
 * Permission Guard Component
 * Provides component-level permission checking to control UI element visibility
 * and access based on user permissions
 */

'use client';

import { ReactNode, useEffect, useState } from 'react';
import { PermissionAction } from '@prisma/client';

interface PermissionGuardProps {
  children: ReactNode;
  resource: string;
  action: PermissionAction;
  fallback?: ReactNode;
  userId: string;
}

/**
 * PermissionGuard Component
 * Wraps UI elements and only renders them if the user has the required permission
 * 
 * @example
 * <PermissionGuard resource="USER" action="CREATE" userId={userId}>
 *   <CreateUserButton />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  resource,
  action,
  fallback = null,
  userId,
}: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkPermission() {
      try {
        const response = await fetch('/api/permissions/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            resource,
            action,
          }),
        });

        const data = await response.json();
        setHasPermission(data.hasPermission || false);
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    }

    checkPermission();
  }, [userId, resource, action]);

  if (loading) {
    return null; // Or a loading skeleton
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Server-side Permission Guard
 * Use this in Server Components for better performance
 */
interface ServerPermissionGuardProps {
  children: ReactNode;
  hasPermission: boolean;
  fallback?: ReactNode;
}

export function ServerPermissionGuard({
  children,
  hasPermission,
  fallback = null,
}: ServerPermissionGuardProps) {
  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook for checking permissions in components
 * Use this when you need to check permissions programmatically
 */
export function usePermission(userId: string, resource: string, action: PermissionAction) {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function checkPermission() {
      try {
        setLoading(true);
        const response = await fetch('/api/permissions/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            resource,
            action,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check permission');
        }

        const data = await response.json();
        setHasPermission(data.hasPermission || false);
      } catch (err) {
        console.error('Error checking permission:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    }

    checkPermission();
  }, [userId, resource, action]);

  return { hasPermission, loading, error };
}
