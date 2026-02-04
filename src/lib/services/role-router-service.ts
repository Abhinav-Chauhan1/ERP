import { UserRole, AuditAction } from "@prisma/client";

/**
 * Role Router Service
 * Routes authenticated users to appropriate dashboards based on role and context.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

export interface SessionContext {
  userId: string;
  role: UserRole;
  activeSchoolId?: string;
  activeStudentId?: string;
  requiresSchoolSelection?: boolean;
  requiresChildSelection?: boolean;
  isOnboarded?: boolean;
  authorizedSchools?: string[];
  availableChildren?: Array<{ id: string; name: string; class?: string }>;
  permissions?: string[];
}

export interface RoutingResult {
  route: string;
  requiresRedirect: boolean;
  reason: string;
  contextRequired?: 'school' | 'child' | 'onboarding';
  fallbackApplied?: boolean;
}

export interface RouteValidationResult {
  isValid: boolean;
  reason: string;
  requiredContext?: 'school' | 'child' | 'onboarding';
  suggestedRoute?: string;
}

// Custom errors for better error handling
export class RoutingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RoutingError';
  }
}

export class InvalidRoleError extends RoutingError {
  constructor(role: string) {
    super(`Invalid or unsupported role: ${role}`, 'INVALID_ROLE');
  }
}

export class UnauthorizedRouteError extends RoutingError {
  constructor(route: string, role: UserRole) {
    super(`Role ${role} not authorized for route: ${route}`, 'UNAUTHORIZED_ROUTE');
  }
}

class RoleRouterService {
  // Route definitions for each role
  private static readonly ROLE_ROUTES = {
    [UserRole.STUDENT]: '/student',
    [UserRole.PARENT]: '/parent', 
    [UserRole.TEACHER]: '/teacher',
    [UserRole.ADMIN]: '/admin',
    [UserRole.SUPER_ADMIN]: '/super-admin'
  };

  // Fallback routes for each role when primary route is inaccessible
  private static readonly FALLBACK_ROUTES = {
    [UserRole.STUDENT]: ['/student/profile', '/student/settings'],
    [UserRole.PARENT]: ['/parent/profile', '/parent/settings'],
    [UserRole.TEACHER]: ['/teacher/profile', '/teacher/settings'],
    [UserRole.ADMIN]: ['/admin/settings', '/admin/users'],
    [UserRole.SUPER_ADMIN]: ['/super-admin/schools', '/super-admin/analytics']
  };

  // Routes that require school context
  private static readonly SCHOOL_SCOPED_ROUTES = [
    '/student',
    '/parent',
    '/teacher',
    '/admin'
  ];

  // Routes that require onboarding completion
  private static readonly ONBOARDING_REQUIRED_ROUTES = [
    '/admin',
    '/admin/dashboard',
    '/admin/settings',
    '/admin/users',
    '/admin/classes',
    '/admin/subjects',
    '/admin/academic',
    '/admin/finance',
    '/admin/reports'
  ];

  // Routes that require child context for parents
  private static readonly CHILD_CONTEXT_ROUTES = [
    '/parent',
    '/parent/dashboard',
    '/parent/attendance',
    '/parent/academics',
    '/parent/performance',
    '/parent/fees',
    '/parent/communication',
    '/parent/documents',
    '/parent/events',
    '/parent/calendar'
  ];

  // Public routes that don't require authentication
  private static readonly PUBLIC_ROUTES = [
    '/',
    '/login',
    '/sd', // Super admin login
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/api/health',
    '/api/status'
  ];

  // Context selection routes
  private static readonly CONTEXT_ROUTES = {
    SCHOOL_SELECTION: '/select-school',
    CHILD_SELECTION: '/select-child',
    ONBOARDING: '/setup'
  };

  /**
   * Get appropriate route for user role and context
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   */
  getRouteForRole(role: UserRole, context: SessionContext): string {
    try {
      // Handle super admin separately (no school context needed)
      if (role === UserRole.SUPER_ADMIN) {
        const route = RoleRouterService.ROLE_ROUTES[role];
        this.logRoutingEvent('ROUTE_DETERMINED', context.userId, route, 'SUPER_ADMIN_ROUTE');
        return route;
      }

      // Check for context requirements in priority order
      
      // 1. School selection required
      if (context.requiresSchoolSelection || (!context.activeSchoolId && this.requiresSchoolContext(role))) {
        const route = RoleRouterService.CONTEXT_ROUTES.SCHOOL_SELECTION;
        this.logRoutingEvent('ROUTE_DETERMINED', context.userId, route, 'SCHOOL_SELECTION_REQUIRED');
        return route;
      }

      // 2. Onboarding required (for school admins)
      if (role === UserRole.ADMIN && context.isOnboarded === false) {
        const route = RoleRouterService.CONTEXT_ROUTES.ONBOARDING;
        this.logRoutingEvent('ROUTE_DETERMINED', context.userId, route, 'ONBOARDING_REQUIRED');
        return route;
      }

      // 3. Child selection required (for parents)
      if (role === UserRole.PARENT && this.requiresChildSelection(context)) {
        const route = RoleRouterService.CONTEXT_ROUTES.CHILD_SELECTION;
        this.logRoutingEvent('ROUTE_DETERMINED', context.userId, route, 'CHILD_SELECTION_REQUIRED');
        return route;
      }

      // 4. Get default route for role with fallback handling
      const defaultRoute = this.getDefaultRouteWithFallback(role, context);
      
      this.logRoutingEvent('ROUTE_DETERMINED', context.userId, defaultRoute, 'DEFAULT_ROLE_ROUTE');
      return defaultRoute;

    } catch (error) {
      console.error('Route determination error:', error);
      const fallbackRoute = this.getEmergencyFallbackRoute(role);
      this.logRoutingEvent('ROUTING_ERROR', context.userId, fallbackRoute, 'ERROR_FALLBACK');
      
      if (error instanceof RoutingError) {
        throw error;
      }
      
      return fallbackRoute;
    }
  }

  /**
   * Validate if user can access a specific route
   * Requirements: 7.6
   */
  validateRouteAccess(user: SessionContext, route: string): boolean {
    try {
      const validation = this.validateRouteAccessDetailed(user, route);
      return validation.isValid;
    } catch (error) {
      console.error('Route access validation error:', error);
      this.logRoutingEvent('ACCESS_ERROR', user.userId, route, 'VALIDATION_ERROR');
      return false;
    }
  }

  /**
   * Detailed route access validation with reasons
   * Requirements: 7.6
   */
  validateRouteAccessDetailed(user: SessionContext, route: string): RouteValidationResult {
    try {
      // Allow access to public routes
      if (this.isPublicRoute(route)) {
        return {
          isValid: true,
          reason: 'PUBLIC_ROUTE'
        };
      }

      // Allow access to context selection routes when needed
      if (this.isContextRoute(route)) {
        return this.validateContextRouteAccess(user, route);
      }

      // Super admin can access all routes
      if (user.role === UserRole.SUPER_ADMIN) {
        this.logRoutingEvent('ACCESS_VALIDATED', user.userId, route, 'SUPER_ADMIN_ACCESS');
        return {
          isValid: true,
          reason: 'SUPER_ADMIN_ACCESS'
        };
      }

      // Check role-based access
      const hasRoleAccess = this.checkRoleAccess(user.role, route);
      if (!hasRoleAccess) {
        this.logRoutingEvent('ACCESS_DENIED', user.userId, route, 'ROLE_MISMATCH');
        return {
          isValid: false,
          reason: 'ROLE_MISMATCH',
          suggestedRoute: this.getDefaultRouteWithFallback(user.role, user)
        };
      }

      // Check school context requirements
      if (this.requiresSchoolContext(route) && !user.activeSchoolId) {
        this.logRoutingEvent('ACCESS_DENIED', user.userId, route, 'MISSING_SCHOOL_CONTEXT');
        return {
          isValid: false,
          reason: 'MISSING_SCHOOL_CONTEXT',
          requiredContext: 'school',
          suggestedRoute: RoleRouterService.CONTEXT_ROUTES.SCHOOL_SELECTION
        };
      }

      // Check child context requirements for parents
      if (this.requiresChildContext(route) && !user.activeStudentId) {
        this.logRoutingEvent('ACCESS_DENIED', user.userId, route, 'MISSING_CHILD_CONTEXT');
        return {
          isValid: false,
          reason: 'MISSING_CHILD_CONTEXT',
          requiredContext: 'child',
          suggestedRoute: RoleRouterService.CONTEXT_ROUTES.CHILD_SELECTION
        };
      }

      // Check onboarding requirements
      if (this.requiresOnboarding(route) && user.isOnboarded === false) {
        this.logRoutingEvent('ACCESS_DENIED', user.userId, route, 'ONBOARDING_INCOMPLETE');
        return {
          isValid: false,
          reason: 'ONBOARDING_INCOMPLETE',
          requiredContext: 'onboarding',
          suggestedRoute: RoleRouterService.CONTEXT_ROUTES.ONBOARDING
        };
      }

      // Check specific permissions if available
      if (user.permissions && this.requiresSpecificPermission(route)) {
        const requiredPermission = this.getRequiredPermission(route);
        if (requiredPermission && !user.permissions.includes(requiredPermission)) {
          this.logRoutingEvent('ACCESS_DENIED', user.userId, route, 'INSUFFICIENT_PERMISSIONS');
          return {
            isValid: false,
            reason: 'INSUFFICIENT_PERMISSIONS',
            suggestedRoute: this.getDefaultRouteWithFallback(user.role, user)
          };
        }
      }

      this.logRoutingEvent('ACCESS_VALIDATED', user.userId, route, 'ACCESS_GRANTED');
      return {
        isValid: true,
        reason: 'ACCESS_GRANTED'
      };

    } catch (error) {
      console.error('Route access validation error:', error);
      this.logRoutingEvent('ACCESS_ERROR', user.userId, route, 'VALIDATION_ERROR');
      return {
        isValid: false,
        reason: 'VALIDATION_ERROR',
        suggestedRoute: this.getEmergencyFallbackRoute(user.role)
      };
    }
  }

  /**
   * Get default route for user (after authentication)
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   */
  getDefaultRoute(user: SessionContext): string {
    return this.getRouteForRole(user.role, user);
  }

  /**
   * Handle routing after authentication
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   */
  handlePostAuthenticationRouting(user: SessionContext, intendedRoute?: string): RoutingResult {
    try {
      // If user has an intended route, validate access
      if (intendedRoute && intendedRoute !== '/login' && intendedRoute !== '/sd') {
        const validation = this.validateRouteAccessDetailed(user, intendedRoute);
        if (validation.isValid) {
          return {
            route: intendedRoute,
            requiresRedirect: true,
            reason: 'INTENDED_ROUTE_ACCESSIBLE'
          };
        } else if (validation.suggestedRoute) {
          return {
            route: validation.suggestedRoute,
            requiresRedirect: true,
            reason: `INTENDED_ROUTE_BLOCKED_${validation.reason}`,
            contextRequired: validation.requiredContext,
            fallbackApplied: true
          };
        }
      }

      // Get default route for user with context awareness
      const defaultRoute = this.getRouteForRole(user.role, user);
      
      // Determine if this is a context route or final destination
      const isContextRoute = this.isContextRoute(defaultRoute);
      
      return {
        route: defaultRoute,
        requiresRedirect: true,
        reason: isContextRoute ? 'CONTEXT_SELECTION_REQUIRED' : 'DEFAULT_ROLE_ROUTE',
        contextRequired: this.getContextTypeFromRoute(defaultRoute)
      };

    } catch (error) {
      console.error('Post-authentication routing error:', error);
      
      const fallbackRoute = this.getEmergencyFallbackRoute(user.role);
      return {
        route: fallbackRoute,
        requiresRedirect: true,
        reason: 'ERROR_FALLBACK',
        fallbackApplied: true
      };
    }
  }

  /**
   * Handle context switching (school or child)
   * Requirements: 5.3, 6.3
   */
  handleContextSwitch(user: SessionContext, contextType: 'school' | 'child', contextId: string): RoutingResult {
    try {
      // Validate context switch is allowed
      if (contextType === 'school' && user.authorizedSchools && !user.authorizedSchools.includes(contextId)) {
        this.logRoutingEvent('CONTEXT_SWITCH_DENIED', user.userId, contextId, 'UNAUTHORIZED_SCHOOL');
        return {
          route: this.getDefaultRouteWithFallback(user.role, user),
          requiresRedirect: true,
          reason: 'UNAUTHORIZED_SCHOOL_ACCESS',
          fallbackApplied: true
        };
      }

      if (contextType === 'child' && user.availableChildren && !user.availableChildren.some(child => child.id === contextId)) {
        this.logRoutingEvent('CONTEXT_SWITCH_DENIED', user.userId, contextId, 'UNAUTHORIZED_CHILD');
        return {
          route: this.getDefaultRouteWithFallback(user.role, user),
          requiresRedirect: true,
          reason: 'UNAUTHORIZED_CHILD_ACCESS',
          fallbackApplied: true
        };
      }

      // Update context and get appropriate route
      const updatedUser = { ...user };
      if (contextType === 'school') {
        updatedUser.activeSchoolId = contextId;
        updatedUser.requiresSchoolSelection = false;
      } else if (contextType === 'child') {
        updatedUser.activeStudentId = contextId;
        updatedUser.requiresChildSelection = false;
      }

      const route = this.getDefaultRouteWithFallback(user.role, updatedUser);
      
      this.logRoutingEvent('CONTEXT_SWITCHED', user.userId, route, `${contextType.toUpperCase()}_CONTEXT_SET`);
      
      return {
        route,
        requiresRedirect: true,
        reason: `${contextType.toUpperCase()}_CONTEXT_SWITCHED`
      };

    } catch (error) {
      console.error('Context switch error:', error);
      
      const fallbackRoute = this.getEmergencyFallbackRoute(user.role);
      return {
        route: fallbackRoute,
        requiresRedirect: true,
        reason: 'CONTEXT_SWITCH_ERROR',
        fallbackApplied: true
      };
    }
  }

  /**
   * Handle edge cases and provide fallback routing
   * Requirements: 7.6
   */
  handleEdgeCaseRouting(user: SessionContext, error?: string): RoutingResult {
    try {
      // Handle specific edge cases
      
      // Case 1: User has no authorized schools
      if (user.role !== UserRole.SUPER_ADMIN && (!user.authorizedSchools || user.authorizedSchools.length === 0)) {
        this.logRoutingEvent('EDGE_CASE_HANDLED', user.userId, '/login', 'NO_AUTHORIZED_SCHOOLS');
        return {
          route: '/login',
          requiresRedirect: true,
          reason: 'NO_AUTHORIZED_SCHOOLS',
          fallbackApplied: true
        };
      }

      // Case 2: School admin with incomplete onboarding
      if (user.role === UserRole.ADMIN && user.isOnboarded === false) {
        this.logRoutingEvent('EDGE_CASE_HANDLED', user.userId, '/setup', 'INCOMPLETE_ONBOARDING');
        return {
          route: '/setup',
          requiresRedirect: true,
          reason: 'INCOMPLETE_ONBOARDING',
          contextRequired: 'onboarding'
        };
      }

      // Case 3: Parent with no children
      if (user.role === UserRole.PARENT && (!user.availableChildren || user.availableChildren.length === 0)) {
        this.logRoutingEvent('EDGE_CASE_HANDLED', user.userId, '/parent/profile', 'NO_CHILDREN_AVAILABLE');
        return {
          route: '/parent/profile',
          requiresRedirect: true,
          reason: 'NO_CHILDREN_AVAILABLE',
          fallbackApplied: true
        };
      }

      // Case 4: User with invalid active school
      if (user.activeSchoolId && user.authorizedSchools && !user.authorizedSchools.includes(user.activeSchoolId)) {
        this.logRoutingEvent('EDGE_CASE_HANDLED', user.userId, '/select-school', 'INVALID_ACTIVE_SCHOOL');
        return {
          route: '/select-school',
          requiresRedirect: true,
          reason: 'INVALID_ACTIVE_SCHOOL',
          contextRequired: 'school',
          fallbackApplied: true
        };
      }

      // Case 5: Student with no enrollment
      if (user.role === UserRole.STUDENT && user.activeSchoolId) {
        // This would require a database check, so we'll handle it in the component
        // For now, route to student profile which can handle the no-enrollment case
        this.logRoutingEvent('EDGE_CASE_HANDLED', user.userId, '/student/profile', 'POTENTIAL_NO_ENROLLMENT');
        return {
          route: '/student/profile',
          requiresRedirect: true,
          reason: 'POTENTIAL_NO_ENROLLMENT',
          fallbackApplied: true
        };
      }

      // Case 6: Teacher with no assignments
      if (user.role === UserRole.TEACHER && user.activeSchoolId) {
        // Route to teacher profile which can handle the no-assignments case
        this.logRoutingEvent('EDGE_CASE_HANDLED', user.userId, '/teacher/profile', 'POTENTIAL_NO_ASSIGNMENTS');
        return {
          route: '/teacher/profile',
          requiresRedirect: true,
          reason: 'POTENTIAL_NO_ASSIGNMENTS',
          fallbackApplied: true
        };
      }

      // Case 7: System error recovery
      if (error) {
        const fallbackRoute = this.getEmergencyFallbackRoute(user.role);
        this.logRoutingEvent('EDGE_CASE_HANDLED', user.userId, fallbackRoute, `SYSTEM_ERROR_RECOVERY: ${error}`);
        return {
          route: fallbackRoute,
          requiresRedirect: true,
          reason: 'SYSTEM_ERROR_RECOVERY',
          fallbackApplied: true
        };
      }

      // Default case: Use standard routing
      const defaultRoute = this.getDefaultRouteWithFallback(user.role, user);
      return {
        route: defaultRoute,
        requiresRedirect: true,
        reason: 'STANDARD_ROUTING'
      };

    } catch (error) {
      console.error('Edge case routing error:', error);
      
      const emergencyRoute = this.getEmergencyFallbackRoute(user.role);
      this.logRoutingEvent('EDGE_CASE_ERROR', user.userId, emergencyRoute, 'EMERGENCY_FALLBACK');
      
      return {
        route: emergencyRoute,
        requiresRedirect: true,
        reason: 'EMERGENCY_FALLBACK',
        fallbackApplied: true
      };
    }
  }

  /**
   * Handle routing when user session is corrupted or invalid
   */
  handleCorruptedSession(partialUser?: Partial<SessionContext>): RoutingResult {
    try {
      // Log the corrupted session attempt
      this.logRoutingEvent('CORRUPTED_SESSION', partialUser?.userId || 'UNKNOWN', '/login', 'SESSION_CORRUPTION_DETECTED');
      
      return {
        route: '/login',
        requiresRedirect: true,
        reason: 'CORRUPTED_SESSION',
        fallbackApplied: true
      };
    } catch (error) {
      console.error('Corrupted session handling error:', error);
      
      return {
        route: '/login',
        requiresRedirect: true,
        reason: 'CORRUPTED_SESSION_ERROR',
        fallbackApplied: true
      };
    }
  }

  /**
   * Handle routing for maintenance mode or system downtime
   */
  handleMaintenanceMode(user: SessionContext): RoutingResult {
    try {
      // Super admin can access system during maintenance
      if (user.role === UserRole.SUPER_ADMIN) {
        this.logRoutingEvent('MAINTENANCE_MODE', user.userId, '/super-admin', 'SUPER_ADMIN_MAINTENANCE_ACCESS');
        return {
          route: '/super-admin',
          requiresRedirect: true,
          reason: 'MAINTENANCE_MODE_SUPER_ADMIN'
        };
      }

      // All other users get maintenance page
      this.logRoutingEvent('MAINTENANCE_MODE', user.userId, '/maintenance', 'MAINTENANCE_MODE_ACTIVE');
      return {
        route: '/maintenance',
        requiresRedirect: true,
        reason: 'MAINTENANCE_MODE_ACTIVE',
        fallbackApplied: true
      };
    } catch (error) {
      console.error('Maintenance mode routing error:', error);
      
      return {
        route: '/maintenance',
        requiresRedirect: true,
        reason: 'MAINTENANCE_MODE_ERROR',
        fallbackApplied: true
      };
    }
  }

  /**
   * Validate and sanitize session context
   */
  validateSessionContext(context: Partial<SessionContext>): SessionContext | null {
    try {
      // Required fields validation
      if (!context.userId || !context.role) {
        return null;
      }

      // Role validation
      if (!Object.values(UserRole).includes(context.role)) {
        return null;
      }

      // Sanitize and provide defaults
      const sanitizedContext: SessionContext = {
        userId: context.userId,
        role: context.role,
        activeSchoolId: context.activeSchoolId || undefined,
        activeStudentId: context.activeStudentId || undefined,
        authorizedSchools: Array.isArray(context.authorizedSchools) ? context.authorizedSchools : [],
        availableChildren: Array.isArray(context.availableChildren) ? context.availableChildren : [],
        permissions: Array.isArray(context.permissions) ? context.permissions : [],
        isOnboarded: context.isOnboarded !== false, // Default to true if not specified
        requiresSchoolSelection: context.requiresSchoolSelection || false,
        requiresChildSelection: context.requiresChildSelection || false
      };

      return sanitizedContext;
    } catch (error) {
      console.error('Session context validation error:', error);
      return null;
    }
  }

  /**
   * Get comprehensive routing with all fallbacks
   */
  getRouteWithFallbacks(context: Partial<SessionContext>, intendedRoute?: string): RoutingResult {
    try {
      // Validate and sanitize context
      const validContext = this.validateSessionContext(context);
      if (!validContext) {
        return this.handleCorruptedSession(context);
      }

      // Check for maintenance mode (this would be set via environment variable or database flag)
      const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
      if (isMaintenanceMode) {
        return this.handleMaintenanceMode(validContext);
      }

      // Handle intended route if provided
      if (intendedRoute) {
        const routingResult = this.handlePostAuthenticationRouting(validContext, intendedRoute);
        if (routingResult.route !== this.getEmergencyFallbackRoute(validContext.role)) {
          return routingResult;
        }
      }

      // Try standard routing
      try {
        const standardRoute = this.getRouteForRole(validContext.role, validContext);
        return {
          route: standardRoute,
          requiresRedirect: true,
          reason: 'STANDARD_ROUTING'
        };
      } catch (error) {
        // Standard routing failed, try edge case handling
        return this.handleEdgeCaseRouting(validContext, error instanceof Error ? error.message : 'Unknown error');
      }

    } catch (error) {
      console.error('Comprehensive routing error:', error);
      
      // Ultimate fallback
      const emergencyRoute = context.role ? this.getEmergencyFallbackRoute(context.role) : '/login';
      return {
        route: emergencyRoute,
        requiresRedirect: true,
        reason: 'ULTIMATE_FALLBACK',
        fallbackApplied: true
      };
    }
  }

  /**
   * Get breadcrumb navigation for current route
   */
  getBreadcrumbs(route: string, user: SessionContext): Array<{ label: string; href: string }> {
    const breadcrumbs: Array<{ label: string; href: string }> = [];

    // Add home based on role
    const homeRoute = RoleRouterService.ROLE_ROUTES[user.role] || '/';
    breadcrumbs.push({
      label: this.getRoleDisplayName(user.role),
      href: homeRoute
    });

    // Parse route segments
    const segments = route.split('/').filter(segment => segment);
    let currentPath = '';

    for (const segment of segments) {
      currentPath += `/${segment}`;
      
      // Skip if it's the home route
      if (currentPath === homeRoute) {
        continue;
      }

      breadcrumbs.push({
        label: this.getRouteDisplayName(segment),
        href: currentPath
      });
    }

    return breadcrumbs;
  }

  // Private helper methods

  /**
   * Get default route with fallback handling
   */
  private getDefaultRouteWithFallback(role: UserRole, context: SessionContext): string {
    const primaryRoute = RoleRouterService.ROLE_ROUTES[role];
    
    if (!primaryRoute) {
      throw new InvalidRoleError(role);
    }

    // Check if primary route is accessible
    const validation = this.validateRouteAccessDetailed(context, primaryRoute);
    if (validation.isValid) {
      return primaryRoute;
    }

    // Try fallback routes
    const fallbackRoutes = RoleRouterService.FALLBACK_ROUTES[role] || [];
    for (const fallbackRoute of fallbackRoutes) {
      const fallbackValidation = this.validateRouteAccessDetailed(context, fallbackRoute);
      if (fallbackValidation.isValid) {
        this.logRoutingEvent('FALLBACK_ROUTE_USED', context.userId, fallbackRoute, 'PRIMARY_ROUTE_INACCESSIBLE');
        return fallbackRoute;
      }
    }

    // Emergency fallback
    return this.getEmergencyFallbackRoute(role);
  }

  /**
   * Get emergency fallback route when all else fails
   */
  private getEmergencyFallbackRoute(role: UserRole): string {
    // Return the most basic route for each role
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return '/super-admin';
      case UserRole.ADMIN:
        return '/admin';
      case UserRole.TEACHER:
        return '/teacher';
      case UserRole.PARENT:
        return '/parent';
      case UserRole.STUDENT:
        return '/student';
      default:
        return '/';
    }
  }

  /**
   * Check if child selection is required for parent
   */
  private requiresChildSelection(context: SessionContext): boolean {
    return Boolean(context.requiresChildSelection) || 
           (context.role === UserRole.PARENT && 
            !context.activeStudentId && 
            (context.availableChildren?.length ?? 0) > 1);
  }

  /**
   * Check if school context is required for role
   */
  private requiresSchoolContext(role: UserRole | string): boolean {
    if (typeof role === 'string') {
      return RoleRouterService.SCHOOL_SCOPED_ROUTES.some(scopedRoute =>
        role.startsWith(scopedRoute)
      );
    }
    
    return role !== UserRole.SUPER_ADMIN;
  }

  /**
   * Check if route requires child context
   */
  private requiresChildContext(route: string): boolean {
    return RoleRouterService.CHILD_CONTEXT_ROUTES.some(childRoute =>
      route.startsWith(childRoute)
    );
  }

  /**
   * Check if route is a context selection route
   */
  private isContextRoute(route: string): boolean {
    return Object.values(RoleRouterService.CONTEXT_ROUTES).includes(route);
  }

  /**
   * Get context type from route
   */
  private getContextTypeFromRoute(route: string): 'school' | 'child' | 'onboarding' | undefined {
    if (route === RoleRouterService.CONTEXT_ROUTES.SCHOOL_SELECTION) return 'school';
    if (route === RoleRouterService.CONTEXT_ROUTES.CHILD_SELECTION) return 'child';
    if (route === RoleRouterService.CONTEXT_ROUTES.ONBOARDING) return 'onboarding';
    return undefined;
  }

  /**
   * Validate context route access
   */
  private validateContextRouteAccess(user: SessionContext, route: string): RouteValidationResult {
    if (route === RoleRouterService.CONTEXT_ROUTES.SCHOOL_SELECTION) {
      return {
        isValid: user.requiresSchoolSelection || !user.activeSchoolId,
        reason: user.requiresSchoolSelection ? 'SCHOOL_SELECTION_REQUIRED' : 'SCHOOL_CONTEXT_MISSING'
      };
    }

    if (route === RoleRouterService.CONTEXT_ROUTES.CHILD_SELECTION) {
      return {
        isValid: user.role === UserRole.PARENT && this.requiresChildSelection(user),
        reason: 'CHILD_SELECTION_REQUIRED'
      };
    }

    if (route === RoleRouterService.CONTEXT_ROUTES.ONBOARDING) {
      return {
        isValid: user.role === UserRole.ADMIN && user.isOnboarded === false,
        reason: 'ONBOARDING_REQUIRED'
      };
    }

    return {
      isValid: false,
      reason: 'UNKNOWN_CONTEXT_ROUTE'
    };
  }

  /**
   * Check if route requires specific permission
   */
  private requiresSpecificPermission(route: string): boolean {
    // Define routes that require specific permissions
    const permissionRoutes = [
      '/admin/users',
      '/admin/settings',
      '/admin/billing',
      '/admin/reports',
      '/teacher/grades',
      '/teacher/attendance'
    ];

    return permissionRoutes.some(permRoute => route.startsWith(permRoute));
  }

  /**
   * Get required permission for route
   */
  private getRequiredPermission(route: string): string | null {
    const permissionMap: Record<string, string> = {
      '/admin/users': 'manage_users',
      '/admin/settings': 'manage_settings',
      '/admin/billing': 'view_billing',
      '/admin/reports': 'view_reports',
      '/teacher/grades': 'manage_grades',
      '/teacher/attendance': 'manage_attendance'
    };

    for (const [routePattern, permission] of Object.entries(permissionMap)) {
      if (route.startsWith(routePattern)) {
        return permission;
      }
    }

    return null;
  }

  /**
   * Check if route is public (no authentication required)
   */
  private isPublicRoute(route: string): boolean {
    return RoleRouterService.PUBLIC_ROUTES.some(publicRoute => 
      route === publicRoute || route.startsWith(publicRoute + '/')
    );
  }

  /**
   * Check if user role can access route
   */
  private checkRoleAccess(role: UserRole, route: string): boolean {
    // Define role-based route access patterns
    const roleRoutePatterns: Record<UserRole, string[]> = {
      [UserRole.STUDENT]: ['/student'],
      [UserRole.PARENT]: ['/parent'],
      [UserRole.TEACHER]: ['/teacher'],
      [UserRole.ADMIN]: ['/admin'],
      [UserRole.SUPER_ADMIN]: ['/super-admin', '/admin', '/teacher', '/parent', '/student']
    };

    const allowedPatterns = roleRoutePatterns[role] || [];
    
    return allowedPatterns.some(pattern => 
      route.startsWith(pattern) || route === pattern
    );
  }

  /**
   * Check if route requires onboarding completion
   */
  private requiresOnboarding(route: string): boolean {
    return RoleRouterService.ONBOARDING_REQUIRED_ROUTES.some(onboardingRoute =>
      route.startsWith(onboardingRoute)
    );
  }

  /**
   * Get display name for role
   */
  private getRoleDisplayName(role: UserRole): string {
    const roleNames: Record<UserRole, string> = {
      [UserRole.STUDENT]: 'Student Dashboard',
      [UserRole.PARENT]: 'Parent Dashboard',
      [UserRole.TEACHER]: 'Teacher Dashboard',
      [UserRole.ADMIN]: 'Admin Dashboard',
      [UserRole.SUPER_ADMIN]: 'Super Admin'
    };

    return roleNames[role] || 'Dashboard';
  }

  /**
   * Get display name for route segment
   */
  private getRouteDisplayName(segment: string): string {
    const segmentNames: Record<string, string> = {
      'dashboard': 'Dashboard',
      'students': 'Students',
      'teachers': 'Teachers',
      'classes': 'Classes',
      'subjects': 'Subjects',
      'exams': 'Exams',
      'attendance': 'Attendance',
      'fees': 'Fees',
      'reports': 'Reports',
      'settings': 'Settings',
      'profile': 'Profile',
      'notifications': 'Notifications',
      'calendar': 'Calendar',
      'assignments': 'Assignments',
      'grades': 'Grades',
      'timetable': 'Timetable',
      'library': 'Library',
      'transport': 'Transport',
      'hostel': 'Hostel',
      'events': 'Events',
      'announcements': 'Announcements',
      'messages': 'Messages',
      'analytics': 'Analytics',
      'billing': 'Billing',
      'schools': 'Schools',
      'users': 'Users',
      'permissions': 'Permissions',
      'audit': 'Audit Logs',
      'monitoring': 'Monitoring',
      'support': 'Support'
    };

    return segmentNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  /**
   * Log routing events for audit
   */
  private async logRoutingEvent(
    action: string,
    userId: string,
    route: string,
    details: string
  ): Promise<void> {
    try {
      // Use dynamic import to avoid Edge Runtime issues
      if (typeof window === 'undefined') {
        const { logAuditEvent } = await import('./audit-service');
        await logAuditEvent({
          userId,
          action: AuditAction.VIEW,
          resource: 'routing',
          changes: {
            route,
            details,
            timestamp: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Failed to log routing event:', error);
      // Don't throw error to avoid breaking routing flow
    }
  }
}

export const roleRouterService = new RoleRouterService();