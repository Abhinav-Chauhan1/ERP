/**
 * Permission Usage Examples
 * This file demonstrates how to use permission checking at multiple layers
 * These examples show the recommended patterns for implementing permission checks
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { 
  withPermission, 
  withAllPermissions, 
  withAnyPermission,
  requirePermission,
  requireAllPermissions,
  ActionResult 
} from '@/lib/utils/permission-wrapper';
import { hasPermission } from '@/lib/utils/permissions';
import { PermissionAction } from '@prisma/client';

/**
 * Example 1: Using withPermission wrapper
 * This is the recommended approach for most server actions
 */
export const createUserExample = withPermission(
  'USER',
  'CREATE' as PermissionAction,
  async (userData: any): Promise<ActionResult> => {
    try {
      // Your implementation here
      // Permission has already been checked by the wrapper
      
      return {
        success: true,
        data: { message: 'User created successfully' },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create user',
      };
    }
  }
);

/**
 * Example 2: Using withAllPermissions for actions requiring multiple permissions
 * User must have ALL specified permissions
 */
export const publishExamExample = withAllPermissions(
  [
    { resource: 'EXAM', action: 'UPDATE' as PermissionAction },
    { resource: 'EXAM', action: 'PUBLISH' as PermissionAction },
  ],
  async (examId: string): Promise<ActionResult> => {
    try {
      // Your implementation here
      // Both UPDATE and PUBLISH permissions have been verified
      
      return {
        success: true,
        data: { message: 'Exam published successfully' },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to publish exam',
      };
    }
  }
);

/**
 * Example 3: Using withAnyPermission for actions with alternative permissions
 * User must have AT LEAST ONE of the specified permissions
 */
export const viewReportExample = withAnyPermission(
  [
    { resource: 'REPORT', action: 'READ' as PermissionAction },
    { resource: 'REPORT', action: 'EXPORT' as PermissionAction },
  ],
  async (reportId: string): Promise<ActionResult> => {
    try {
      // Your implementation here
      // User has either READ or EXPORT permission
      
      return {
        success: true,
        data: { message: 'Report retrieved successfully' },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to retrieve report',
      };
    }
  }
);

/**
 * Example 4: Using requirePermission for inline permission checks
 * Useful when you need more control over the flow
 */
export async function deleteUserExample(userId: string): Promise<ActionResult> {
  try {
    const { userId: currentUserId } = await auth();
    
    if (!currentUserId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }
    
    // Check permission inline
    await requirePermission(currentUserId, 'USER', 'DELETE' as PermissionAction);
    
    // Additional business logic checks
    if (userId === currentUserId) {
      return {
        success: false,
        error: 'Cannot delete your own account',
      };
    }
    
    // Your implementation here
    
    return {
      success: true,
      data: { message: 'User deleted successfully' },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    };
  }
}

/**
 * Example 5: Using requireAllPermissions for complex permission logic
 */
export async function approvePaymentExample(paymentId: string): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }
    
    // Check multiple permissions
    await requireAllPermissions(userId, [
      { resource: 'PAYMENT', action: 'READ' as PermissionAction },
      { resource: 'PAYMENT', action: 'APPROVE' as PermissionAction },
    ]);
    
    // Your implementation here
    
    return {
      success: true,
      data: { message: 'Payment approved successfully' },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve payment',
    };
  }
}

/**
 * Example 6: Manual permission check for conditional logic
 * Use when you need to show different behavior based on permissions
 */
export async function getUserDetailsExample(targetUserId: string): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }
    
    // Check if user can view sensitive data
    const canViewSensitiveData = await hasPermission(
      userId,
      'USER',
      'READ' as PermissionAction
    );
    
    // Fetch user data
    const userData: any = {
      id: targetUserId,
      name: 'John Doe',
      email: 'john@example.com',
    };
    
    // Conditionally include sensitive data
    if (canViewSensitiveData) {
      userData.phone = '+1234567890';
      userData.address = '123 Main St';
      userData.salary = 50000;
    }
    
    return {
      success: true,
      data: userData,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to retrieve user details',
    };
  }
}

/**
 * Example 7: Checking permissions in Server Components
 * This pattern is used in page components
 */
export async function checkUserPermissionsForPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canExport: false,
    };
  }
  
  // Check multiple permissions in parallel
  const [canCreate, canUpdate, canDelete, canExport] = await Promise.all([
    hasPermission(userId, 'USER', 'CREATE' as PermissionAction),
    hasPermission(userId, 'USER', 'UPDATE' as PermissionAction),
    hasPermission(userId, 'USER', 'DELETE' as PermissionAction),
    hasPermission(userId, 'USER', 'EXPORT' as PermissionAction),
  ]);
  
  return {
    canCreate,
    canUpdate,
    canDelete,
    canExport,
  };
}
