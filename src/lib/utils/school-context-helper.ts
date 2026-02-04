/**
 * School Context Helper Utilities
 * 
 * Provides consistent school context handling across the application
 * for database operations that require schoolId.
 */

import { getCurrentUserSchoolContext } from '@/lib/auth/tenant';

/**
 * Gets the required school ID from current context
 * Throws error if no school context is available
 */
export async function getRequiredSchoolId(): Promise<string> {
  const context = await getCurrentUserSchoolContext();
  
  if (!context) {
    throw new Error('Authentication required');
  }
  
  if (!context.schoolId && !context.isSuperAdmin) {
    throw new Error('School context required');
  }
  
  // For super admin, we might need to handle differently
  // For now, require explicit schoolId even for super admin
  if (!context.schoolId) {
    throw new Error('School ID required for this operation');
  }
  
  return context.schoolId;
}

/**
 * Gets the current user ID from context
 */
export async function getRequiredUserId(): Promise<string> {
  const context = await getCurrentUserSchoolContext();
  
  if (!context?.userId) {
    throw new Error('Authentication required');
  }
  
  return context.userId;
}

/**
 * Gets both school ID and user ID from context
 */
export async function getRequiredContext(): Promise<{ schoolId: string; userId: string }> {
  const context = await getCurrentUserSchoolContext();
  
  if (!context) {
    throw new Error('Authentication required');
  }
  
  if (!context.schoolId && !context.isSuperAdmin) {
    throw new Error('School context required');
  }
  
  if (!context.schoolId) {
    throw new Error('School ID required for this operation');
  }
  
  return {
    schoolId: context.schoolId,
    userId: context.userId
  };
}

/**
 * Adds schoolId to data object for database operations
 */
export async function withSchoolId<T extends Record<string, any>>(data: T): Promise<T & { schoolId: string }> {
  const schoolId = await getRequiredSchoolId();
  return { ...data, schoolId };
}

/**
 * Adds both schoolId and userId to data object for database operations
 */
export async function withSchoolContext<T extends Record<string, any>>(data: T): Promise<T & { schoolId: string; userId: string }> {
  const context = await getRequiredContext();
  return { ...data, ...context };
}