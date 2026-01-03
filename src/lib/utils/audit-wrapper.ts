/**
 * Audit Wrapper Utilities
 * 
 * Provides wrapper functions to automatically add audit logging to server actions.
 * 
 * Requirements: 6.2
 */

import { auth } from '@/auth';
import { AuditAction } from '@prisma/client';
import { logAudit } from './audit-log';

/**
 * Wrapper for server actions that automatically logs the action
 * 
 * @param action - The audit action type
 * @param resource - The resource being acted upon
 * @param fn - The function to wrap
 * @returns Wrapped function with audit logging
 */
export function withAudit<T extends (...args: any[]) => Promise<any>>(
  action: AuditAction,
  resource: string,
  fn: T
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      throw new Error('Unauthorized');
    }
    
    try {
      const result = await fn(...args);
      
      // Extract resource ID from result if available
      let resourceId: string | undefined;
      if (result && typeof result === 'object') {
        if ('id' in result) {
          resourceId = result.id;
        } else if ('data' in result && result.data && 'id' in result.data) {
          resourceId = result.data.id;
        }
      }
      
      // Log the action
      await logAudit({
        userId,
        action,
        resource,
        resourceId,
      });
      
      return result;
    } catch (error) {
      // Still log failed attempts
      await logAudit({
        userId,
        action,
        resource,
        changes: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      
      throw error;
    }
  }) as T;
}

/**
 * Wrapper specifically for CREATE actions
 */
export function withCreateAudit<T extends (...args: any[]) => Promise<any>>(
  resource: string,
  fn: T
): T {
  return withAudit(AuditAction.CREATE, resource, fn);
}

/**
 * Wrapper specifically for UPDATE actions
 */
export function withUpdateAudit<T extends (...args: any[]) => Promise<any>>(
  resource: string,
  fn: T
): T {
  return withAudit(AuditAction.UPDATE, resource, fn);
}

/**
 * Wrapper specifically for DELETE actions
 */
export function withDeleteAudit<T extends (...args: any[]) => Promise<any>>(
  resource: string,
  fn: T
): T {
  return withAudit(AuditAction.DELETE, resource, fn);
}

/**
 * Wrapper specifically for READ actions
 */
export function withReadAudit<T extends (...args: any[]) => Promise<any>>(
  resource: string,
  fn: T
): T {
  return withAudit(AuditAction.READ, resource, fn);
}
