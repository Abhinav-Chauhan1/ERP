/**
 * Permission checking utilities for middleware
 * This module provides permission validation at the middleware layer
 * to enforce access control before requests reach route handlers
 */

import { NextRequest } from 'next/server';
import { UserRole, PermissionAction } from '@prisma/client';

/**
 * Route permission configuration
 * Maps route patterns to required permissions
 */
export interface RoutePermission {
  pattern: RegExp;
  resource: string;
  action: PermissionAction;
  roles?: UserRole[]; // Optional: restrict to specific roles
}

/**
 * Define route-level permissions
 * These are checked in middleware before the request reaches the handler
 */
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // User Management Routes
  { pattern: /^\/admin\/users\/create/, resource: 'USER', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/users\/\w+\/edit/, resource: 'USER', action: 'UPDATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/users\/\w+\/delete/, resource: 'USER', action: 'DELETE', roles: [UserRole.ADMIN] },
  { pattern: /^\/api\/admin\/users$/, resource: 'USER', action: 'CREATE', roles: [UserRole.ADMIN] },
  
  // Student Management Routes
  { pattern: /^\/admin\/users\/students\/create/, resource: 'STUDENT', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/users\/students\/\w+\/edit/, resource: 'STUDENT', action: 'UPDATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/api\/admin\/students$/, resource: 'STUDENT', action: 'CREATE', roles: [UserRole.ADMIN] },
  
  // Teacher Management Routes
  { pattern: /^\/admin\/users\/teachers\/create/, resource: 'TEACHER', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/users\/teachers\/\w+\/edit/, resource: 'TEACHER', action: 'UPDATE', roles: [UserRole.ADMIN] },
  
  // Class Management Routes
  { pattern: /^\/admin\/classes\/create/, resource: 'CLASS', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/classes\/\w+\/edit/, resource: 'CLASS', action: 'UPDATE', roles: [UserRole.ADMIN] },
  
  // Exam Management Routes
  { pattern: /^\/admin\/assessment\/exams\/create/, resource: 'EXAM', action: 'CREATE', roles: [UserRole.ADMIN, UserRole.TEACHER] },
  { pattern: /^\/admin\/assessment\/exams\/\w+\/edit/, resource: 'EXAM', action: 'UPDATE', roles: [UserRole.ADMIN, UserRole.TEACHER] },
  { pattern: /^\/admin\/assessment\/exams\/\w+\/publish/, resource: 'EXAM', action: 'PUBLISH', roles: [UserRole.ADMIN, UserRole.TEACHER] },
  
  // Assignment Management Routes
  { pattern: /^\/teacher\/teaching\/assignments\/create/, resource: 'ASSIGNMENT', action: 'CREATE', roles: [UserRole.TEACHER] },
  { pattern: /^\/teacher\/teaching\/assignments\/\w+\/edit/, resource: 'ASSIGNMENT', action: 'UPDATE', roles: [UserRole.TEACHER] },
  
  // Fee Management Routes
  { pattern: /^\/admin\/finance\/fees\/create/, resource: 'FEE', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/finance\/fees\/\w+\/edit/, resource: 'FEE', action: 'UPDATE', roles: [UserRole.ADMIN] },
  
  // Payment Management Routes
  { pattern: /^\/admin\/finance\/payments\/\w+\/approve/, resource: 'PAYMENT', action: 'APPROVE', roles: [UserRole.ADMIN] },
  
  // Announcement Management Routes
  { pattern: /^\/admin\/communication\/announcements\/create/, resource: 'ANNOUNCEMENT', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/communication\/announcements\/\w+\/publish/, resource: 'ANNOUNCEMENT', action: 'PUBLISH', roles: [UserRole.ADMIN] },
  
  // Library Management Routes
  { pattern: /^\/admin\/library\/books\/create/, resource: 'BOOK', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/library\/books\/\w+\/edit/, resource: 'BOOK', action: 'UPDATE', roles: [UserRole.ADMIN] },
  
  // Transport Management Routes
  { pattern: /^\/admin\/transport\/vehicles\/create/, resource: 'VEHICLE', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/transport\/routes\/create/, resource: 'ROUTE', action: 'CREATE', roles: [UserRole.ADMIN] },
  
  // Admission Management Routes
  { pattern: /^\/admin\/admissions\/\w+\/approve/, resource: 'APPLICATION', action: 'APPROVE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/admissions\/\w+\/reject/, resource: 'APPLICATION', action: 'REJECT', roles: [UserRole.ADMIN] },
  
  // Certificate Management Routes
  { pattern: /^\/admin\/certificates\/create/, resource: 'CERTIFICATE', action: 'CREATE', roles: [UserRole.ADMIN] },
  
  // Backup Management Routes
  { pattern: /^\/admin\/backups\/create/, resource: 'BACKUP', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/api\/admin\/backups$/, resource: 'BACKUP', action: 'CREATE', roles: [UserRole.ADMIN] },
  
  // Report Management Routes
  { pattern: /^\/admin\/reports\/export/, resource: 'REPORT', action: 'EXPORT', roles: [UserRole.ADMIN, UserRole.TEACHER] },
  
  // Settings Routes
  { pattern: /^\/admin\/settings/, resource: 'SETTINGS', action: 'UPDATE', roles: [UserRole.ADMIN] },
  
  // Syllabus Module Management Routes (Enhanced Syllabus System)
  { pattern: /^\/admin\/academic\/syllabus\/modules\/create/, resource: 'MODULE', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/academic\/syllabus\/modules\/\w+\/edit/, resource: 'MODULE', action: 'UPDATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/academic\/syllabus\/modules\/\w+\/delete/, resource: 'MODULE', action: 'DELETE', roles: [UserRole.ADMIN] },
  { pattern: /^\/api\/admin\/syllabus\/modules/, resource: 'MODULE', action: 'CREATE', roles: [UserRole.ADMIN] },
  
  // Syllabus Sub-Module Management Routes
  { pattern: /^\/admin\/academic\/syllabus\/sub-modules\/create/, resource: 'SUBMODULE', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/academic\/syllabus\/sub-modules\/\w+\/edit/, resource: 'SUBMODULE', action: 'UPDATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/academic\/syllabus\/sub-modules\/\w+\/delete/, resource: 'SUBMODULE', action: 'DELETE', roles: [UserRole.ADMIN] },
  
  // Syllabus Document Management Routes
  { pattern: /^\/admin\/academic\/syllabus\/documents\/upload/, resource: 'DOCUMENT', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/academic\/syllabus\/documents\/\w+\/edit/, resource: 'DOCUMENT', action: 'UPDATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/academic\/syllabus\/documents\/\w+\/delete/, resource: 'DOCUMENT', action: 'DELETE', roles: [UserRole.ADMIN] },
  { pattern: /^\/api\/admin\/syllabus\/documents/, resource: 'DOCUMENT', action: 'CREATE', roles: [UserRole.ADMIN] },
  
  // Syllabus Progress Tracking Routes
  { pattern: /^\/teacher\/teaching\/syllabus\/progress/, resource: 'PROGRESS', action: 'UPDATE', roles: [UserRole.TEACHER] },
  { pattern: /^\/api\/teacher\/syllabus\/progress/, resource: 'PROGRESS', action: 'UPDATE', roles: [UserRole.TEACHER] },
  
  // Student Promotion Routes
  { pattern: /^\/admin\/academic\/promotion$/, resource: 'PROMOTION', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/academic\/promotion\/history/, resource: 'PROMOTION', action: 'READ', roles: [UserRole.ADMIN] },
  { pattern: /^\/api\/admin\/promotion\/preview/, resource: 'PROMOTION', action: 'READ', roles: [UserRole.ADMIN] },
  { pattern: /^\/api\/admin\/promotion\/execute/, resource: 'PROMOTION', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/api\/admin\/promotion\/rollback/, resource: 'PROMOTION', action: 'DELETE', roles: [UserRole.ADMIN] },
  
  // Graduation Ceremony Routes
  { pattern: /^\/admin\/academic\/graduation/, resource: 'GRADUATION', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/api\/admin\/graduation/, resource: 'GRADUATION', action: 'CREATE', roles: [UserRole.ADMIN] },
  
  // Alumni Management Routes (Admin)
  { pattern: /^\/admin\/alumni\/communication/, resource: 'ALUMNI', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/alumni\/statistics/, resource: 'ALUMNI', action: 'READ', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/alumni\/\w+\/edit/, resource: 'ALUMNI', action: 'UPDATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/alumni\/\w+$/, resource: 'ALUMNI', action: 'READ', roles: [UserRole.ADMIN] },
  { pattern: /^\/admin\/alumni$/, resource: 'ALUMNI', action: 'READ', roles: [UserRole.ADMIN] },
  { pattern: /^\/api\/admin\/alumni\/message/, resource: 'ALUMNI', action: 'CREATE', roles: [UserRole.ADMIN] },
  { pattern: /^\/api\/admin\/alumni\/report/, resource: 'ALUMNI', action: 'READ', roles: [UserRole.ADMIN] },
  { pattern: /^\/api\/admin\/alumni\/search/, resource: 'ALUMNI', action: 'READ', roles: [UserRole.ADMIN] },
  { pattern: /^\/api\/admin\/alumni\/\w+/, resource: 'ALUMNI', action: 'UPDATE', roles: [UserRole.ADMIN] },
  
  // Alumni Portal Routes (for Alumni users - students with graduated status)
  { pattern: /^\/alumni\/dashboard/, resource: 'ALUMNI_PORTAL', action: 'READ', roles: [UserRole.STUDENT] },
  { pattern: /^\/alumni\/profile/, resource: 'ALUMNI_PORTAL', action: 'UPDATE', roles: [UserRole.STUDENT] },
  { pattern: /^\/alumni\/directory/, resource: 'ALUMNI_PORTAL', action: 'READ', roles: [UserRole.STUDENT] },
  { pattern: /^\/api\/alumni\/profile/, resource: 'ALUMNI_PORTAL', action: 'UPDATE', roles: [UserRole.STUDENT] },
];

/**
 * Check if a user has permission to access a route
 * This is a lightweight check for middleware that doesn't query the database
 * 
 * @param pathname - The request pathname
 * @param userRole - The user's role from session claims
 * @returns Object with allowed status and optional permission info
 */
export function checkPermissionInMiddleware(
  pathname: string,
  userRole: UserRole
): { allowed: boolean; resource?: string; action?: PermissionAction; reason?: string } {
  // Find matching route permission
  const matchedPermission = ROUTE_PERMISSIONS.find(rp => rp.pattern.test(pathname));
  
  if (!matchedPermission) {
    // No specific permission required for this route
    return { allowed: true };
  }
  
  // Check if user's role is allowed for this route
  if (matchedPermission.roles && !matchedPermission.roles.includes(userRole)) {
    return {
      allowed: false,
      resource: matchedPermission.resource,
      action: matchedPermission.action,
      reason: `Role ${userRole} is not allowed to access this route`,
    };
  }
  
  // Role is allowed, but actual permission check will happen in the route handler
  // This is because middleware cannot efficiently query the database
  return {
    allowed: true,
    resource: matchedPermission.resource,
    action: matchedPermission.action,
  };
}

/**
 * Extract permission requirements from a route
 * Used for logging and debugging
 * 
 * @param pathname - The request pathname
 * @returns Permission requirements or null if no specific permission required
 */
export function getRoutePermissionRequirements(pathname: string): RoutePermission | null {
  return ROUTE_PERMISSIONS.find(rp => rp.pattern.test(pathname)) || null;
}

/**
 * Check if a route requires specific permissions
 * 
 * @param pathname - The request pathname
 * @returns True if route has specific permission requirements
 */
export function routeRequiresPermission(pathname: string): boolean {
  return ROUTE_PERMISSIONS.some(rp => rp.pattern.test(pathname));
}

/**
 * Get all routes that require a specific permission
 * Useful for permission management interfaces
 * 
 * @param resource - The resource name
 * @param action - The action name
 * @returns Array of route patterns that require this permission
 */
export function getRoutesForPermission(resource: string, action: PermissionAction): RoutePermission[] {
  return ROUTE_PERMISSIONS.filter(
    rp => rp.resource === resource && rp.action === action
  );
}
