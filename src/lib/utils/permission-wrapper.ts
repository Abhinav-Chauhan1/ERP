/**
 * Permission Wrapper Utilities
 * Provides higher-order functions to wrap server actions with permission checks
 * This ensures permissions are validated at multiple layers
 */

import { auth } from '@clerk/nextjs/server';
import { hasPermission } from './permissions';
import { PermissionAction } from '@prisma/client';

/**
 * Result type for server actions
 */
export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Wrap a server action with permission checking
 * This ensures the action can only be executed if the user has the required permission
 * 
 * @param resource - The resource being accessed
 * @param action - The action being performed
 * @param handler - The actual server action handler
 * @returns Wrapped server action with permission checking
 * 
 * @example
 * export const createStudent = withPermission(
 *   'STUDENT',
 *   'CREATE',
 *   async (data: StudentInput) => {
 *     // Your implementation here
 *     return { success: true, data: student };
 *   }
 * );
 */
export function withPermission<TArgs extends any[], TReturn>(
  resource: string,
  action: PermissionAction,
  handler: (...args: TArgs) => Promise<ActionResult<TReturn>>
) {
  return async (...args: TArgs): Promise<ActionResult<TReturn>> => {
    try {
      // Get authenticated user
      const { userId } = await auth();
      
      if (!userId) {
        return {
          success: false,
          error: 'Unauthorized: You must be logged in to perform this action',
        };
      }

      // Check permission
      const hasRequiredPermission = await hasPermission(userId, resource, action);
      
      if (!hasRequiredPermission) {
        return {
          success: false,
          error: `Forbidden: You do not have permission to ${action} ${resource}`,
        };
      }

      // Execute the handler
      return await handler(...args);
    } catch (error) {
      console.error(`Error in withPermission wrapper for ${resource}.${action}:`, error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  };
}

/**
 * Wrap a server action with multiple permission checks (AND logic)
 * All permissions must be satisfied for the action to execute
 * 
 * @param checks - Array of permission checks
 * @param handler - The actual server action handler
 * @returns Wrapped server action with permission checking
 * 
 * @example
 * export const publishExam = withAllPermissions(
 *   [
 *     { resource: 'EXAM', action: 'UPDATE' },
 *     { resource: 'EXAM', action: 'PUBLISH' },
 *   ],
 *   async (examId: string) => {
 *     // Your implementation here
 *     return { success: true };
 *   }
 * );
 */
export function withAllPermissions<TArgs extends any[], TReturn>(
  checks: Array<{ resource: string; action: PermissionAction }>,
  handler: (...args: TArgs) => Promise<ActionResult<TReturn>>
) {
  return async (...args: TArgs): Promise<ActionResult<TReturn>> => {
    try {
      // Get authenticated user
      const { userId } = await auth();
      
      if (!userId) {
        return {
          success: false,
          error: 'Unauthorized: You must be logged in to perform this action',
        };
      }

      // Check all permissions
      const permissionResults = await Promise.all(
        checks.map(check => hasPermission(userId, check.resource, check.action))
      );
      
      const allPermissionsGranted = permissionResults.every(result => result === true);
      
      if (!allPermissionsGranted) {
        const missingPermissions = checks
          .filter((_, index) => !permissionResults[index])
          .map(check => `${check.action} ${check.resource}`)
          .join(', ');
        
        return {
          success: false,
          error: `Forbidden: You do not have the required permissions: ${missingPermissions}`,
        };
      }

      // Execute the handler
      return await handler(...args);
    } catch (error) {
      console.error('Error in withAllPermissions wrapper:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  };
}

/**
 * Wrap a server action with multiple permission checks (OR logic)
 * At least one permission must be satisfied for the action to execute
 * 
 * @param checks - Array of permission checks
 * @param handler - The actual server action handler
 * @returns Wrapped server action with permission checking
 * 
 * @example
 * export const viewReport = withAnyPermission(
 *   [
 *     { resource: 'REPORT', action: 'READ' },
 *     { resource: 'REPORT', action: 'EXPORT' },
 *   ],
 *   async (reportId: string) => {
 *     // Your implementation here
 *     return { success: true, data: report };
 *   }
 * );
 */
export function withAnyPermission<TArgs extends any[], TReturn>(
  checks: Array<{ resource: string; action: PermissionAction }>,
  handler: (...args: TArgs) => Promise<ActionResult<TReturn>>
) {
  return async (...args: TArgs): Promise<ActionResult<TReturn>> => {
    try {
      // Get authenticated user
      const { userId } = await auth();
      
      if (!userId) {
        return {
          success: false,
          error: 'Unauthorized: You must be logged in to perform this action',
        };
      }

      // Check all permissions
      const permissionResults = await Promise.all(
        checks.map(check => hasPermission(userId, check.resource, check.action))
      );
      
      const anyPermissionGranted = permissionResults.some(result => result === true);
      
      if (!anyPermissionGranted) {
        const requiredPermissions = checks
          .map(check => `${check.action} ${check.resource}`)
          .join(' OR ');
        
        return {
          success: false,
          error: `Forbidden: You need at least one of these permissions: ${requiredPermissions}`,
        };
      }

      // Execute the handler
      return await handler(...args);
    } catch (error) {
      console.error('Error in withAnyPermission wrapper:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  };
}

/**
 * Check permission and throw error if not authorized
 * Useful for inline permission checks in server actions
 * 
 * @param userId - The user ID to check
 * @param resource - The resource being accessed
 * @param action - The action being performed
 * @throws Error if user doesn't have permission
 * 
 * @example
 * export async function deleteUser(userId: string) {
 *   const { userId: currentUserId } = await auth();
 *   await requirePermission(currentUserId!, 'USER', 'DELETE');
 *   
 *   // Proceed with deletion
 *   await prisma.user.delete({ where: { id: userId } });
 * }
 */
export async function requirePermission(
  userId: string,
  resource: string,
  action: PermissionAction
): Promise<void> {
  const hasRequiredPermission = await hasPermission(userId, resource, action);
  
  if (!hasRequiredPermission) {
    throw new Error(`Forbidden: You do not have permission to ${action} ${resource}`);
  }
}

/**
 * Check multiple permissions and throw error if not all are satisfied
 * 
 * @param userId - The user ID to check
 * @param checks - Array of permission checks
 * @throws Error if user doesn't have all permissions
 */
export async function requireAllPermissions(
  userId: string,
  checks: Array<{ resource: string; action: PermissionAction }>
): Promise<void> {
  const permissionResults = await Promise.all(
    checks.map(check => hasPermission(userId, check.resource, check.action))
  );
  
  const allPermissionsGranted = permissionResults.every(result => result === true);
  
  if (!allPermissionsGranted) {
    const missingPermissions = checks
      .filter((_, index) => !permissionResults[index])
      .map(check => `${check.action} ${check.resource}`)
      .join(', ');
    
    throw new Error(`Forbidden: You do not have the required permissions: ${missingPermissions}`);
  }
}

/**
 * Check multiple permissions and throw error if none are satisfied
 * 
 * @param userId - The user ID to check
 * @param checks - Array of permission checks
 * @throws Error if user doesn't have any of the permissions
 */
export async function requireAnyPermission(
  userId: string,
  checks: Array<{ resource: string; action: PermissionAction }>
): Promise<void> {
  const permissionResults = await Promise.all(
    checks.map(check => hasPermission(userId, check.resource, check.action))
  );
  
  const anyPermissionGranted = permissionResults.some(result => result === true);
  
  if (!anyPermissionGranted) {
    const requiredPermissions = checks
      .map(check => `${check.action} ${check.resource}`)
      .join(' OR ');
    
    throw new Error(`Forbidden: You need at least one of these permissions: ${requiredPermissions}`);
  }
}
