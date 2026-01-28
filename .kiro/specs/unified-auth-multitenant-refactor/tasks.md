# Implementation Tasks

## Phase 1: Database Schema and Core Models

### Task 1: Update Database Schema for Multi-Tenant Authentication
**Requirements:** 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
- [ ] 1.1 Update User model to support nullable mobile and email fields
- [ ] 1.2 Update UserSchool model to use UserRole enum instead of string
- [ ] 1.3 Create OTP model for secure code storage and verification
- [ ] 1.4 Create Session model for JWT session management
- [ ] 1.5 Create AuditLog model for comprehensive authentication logging
- [ ] 1.6 Update Student model to include parentMobile field for parent-child linking
- [ ] 1.7 Add database indexes for performance optimization
- [ ] 1.8 Create and run database migration

### Task 2: Core Service Layer Implementation
**Requirements:** 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 11.1, 11.2, 11.3, 11.4, 11.5
- [ ] 2.1 Implement AuthenticationService with unified authentication logic
- [ ] 2.2 Implement OTPService with generation, verification, and rate limiting
- [ ] 2.3 Implement SchoolContextService for school validation and context management
- [ ] 2.4 Implement JWTService for token creation, validation, and refresh
- [ ] 2.5 Implement RoleRouterService for dashboard routing based on role
- [ ] 2.6 Update existing PermissionService to support multi-tenant permissions

## Phase 2: Authentication Flow Implementation

### Task 3: Unified Login System
**Requirements:** 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5
- [ ] 3.1 Create unified login page component with school code input
- [ ] 3.2 Implement school code validation and context loading
- [ ] 3.3 Create authentication form with dynamic method selection based on role
- [ ] 3.4 Implement OTP input component for students and parents
- [ ] 3.5 Implement password input component for teachers and admins
- [ ] 3.6 Add form validation and error handling
- [ ] 3.7 Update login page route to replace existing login system

### Task 4: Super Admin Separate Authentication
**Requirements:** 3A.1, 3A.2, 3A.3, 3A.4, 3A.5
- [ ] 4.1 Create /sd route for super admin login
- [ ] 4.2 Implement super admin login page component
- [ ] 4.3 Create super admin authentication logic (email/password only)
- [ ] 4.4 Implement additional security measures for super admin route
- [ ] 4.5 Add redirect to /super-admin dashboard after successful authentication

### Task 5: Multi-School and Multi-Child Context Management
**Requirements:** 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5
- [ ] 5.1 Create school selection component for multi-school users
- [ ] 5.2 Create child selection component for parents with multiple children
- [ ] 5.3 Implement context switching without re-authentication
- [ ] 5.4 Create session management for active school and student contexts
- [ ] 5.5 Add validation for school and child access permissions

## Phase 3: Authentication Middleware and Security

### Task 6: Enhanced Authentication Middleware
**Requirements:** 12.1, 12.2, 12.3, 12.4, 12.5, 8.1, 8.2, 8.3, 8.4, 8.5
- [ ] 6.1 Update authentication middleware to support JWT validation
- [ ] 6.2 Implement school context validation in middleware
- [ ] 6.3 Add role-based route protection
- [ ] 6.4 Implement tenant data isolation checks
- [ ] 6.5 Add comprehensive audit logging for all authentication events
- [ ] 6.6 Update existing middleware to use new authentication system

### Task 7: Rate Limiting and Abuse Protection
**Requirements:** 14.1, 14.2, 14.3, 14.4, 14.5
- [ ] 7.1 Implement OTP rate limiting (3 requests per mobile per 5 minutes)
- [ ] 7.2 Add exponential backoff for repeated login failures
- [ ] 7.3 Implement temporary blocking for suspicious activity
- [ ] 7.4 Create admin interface for managing blocked identifiers
- [ ] 7.5 Add comprehensive logging for all rate limiting events

## Phase 4: Dashboard Routing and User Experience

### Task 8: Role-Based Dashboard Routing
**Requirements:** 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
- [ ] 8.1 Update RoleRouterService with complete routing logic
- [ ] 8.2 Implement automatic redirection after authentication
- [ ] 8.3 Add route access validation for each dashboard type
- [ ] 8.4 Update existing dashboard pages to work with new authentication
- [ ] 8.5 Implement fallback routing for edge cases

### Task 9: Setup Wizard Integration
**Requirements:** 9.1, 9.2, 9.3, 9.4, 9.5
- [ ] 9.1 Update school creation to set isOnboarded flag to false
- [ ] 9.2 Implement onboarding check in school admin dashboard
- [ ] 9.3 Add setup wizard redirection for non-onboarded schools
- [ ] 9.4 Create super admin controls for managing onboarding state
- [ ] 9.5 Implement independent onboarding progress tracking per school

## Phase 5: API Integration and Migration

### Task 10: Authentication API Endpoints
**Requirements:** 1.1, 2.1, 4.1, 5.1, 6.1, 11.1
- [ ] 10.1 Create /api/auth/school-validate endpoint for school code validation
- [ ] 10.2 Create /api/auth/otp/generate endpoint for OTP generation
- [ ] 10.3 Create /api/auth/otp/verify endpoint for OTP verification
- [ ] 10.4 Create /api/auth/login endpoint for unified authentication
- [ ] 10.5 Create /api/auth/context/switch endpoint for context switching
- [ ] 10.6 Update existing authentication endpoints to use new system

### Task 11: Super Admin Control Panel Integration
**Requirements:** 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
- [ ] 11.1 Update school creation API to support new authentication system
- [ ] 11.2 Add school status management (activate/suspend) with authentication impact
- [ ] 11.3 Implement user account management across all schools
- [ ] 11.4 Add setup wizard launch and reset functionality
- [ ] 11.5 Create usage analytics integration with authentication events
- [ ] 11.6 Implement emergency access controls for disabling accounts

## Phase 6: Testing and Validation

### Task 12: Unit Tests for Core Services
**Requirements:** All requirements validation through unit testing
- [ ] 12.1 Write unit tests for AuthenticationService
- [ ] 12.2 Write unit tests for OTPService including rate limiting
- [ ] 12.3 Write unit tests for SchoolContextService
- [ ] 12.4 Write unit tests for JWTService
- [ ] 12.5 Write unit tests for RoleRouterService
- [ ] 12.6 Write unit tests for authentication middleware

### Task 13: Property-Based Tests for System Correctness
**Requirements:** Property validation across all system behaviors
- [ ] 13.1 Write property test for unified login redirection (Property 1)
- [ ] 13.2 Write property test for school code validation (Property 2)
- [ ] 13.3 Write property test for school context security (Property 3)
- [ ] 13.4 Write property test for role-based authentication method determination (Property 4)
- [ ] 13.5 Write property test for OTP security and lifecycle management (Property 5)
- [ ] 13.6 Write property test for multi-school user context management (Property 6)
- [ ] 13.7 Write property test for parent multi-child context management (Property 7)
- [ ] 13.8 Write property test for role-based dashboard routing (Property 8)
- [ ] 13.9 Write property test for tenant data isolation (Property 9)
- [ ] 13.10 Write property test for school onboarding state management (Property 10)
- [ ] 13.11 Write property test for super admin universal access (Property 11)
- [ ] 13.12 Write property test for JWT session management (Property 12)
- [ ] 13.13 Write property test for route protection and access control (Property 13)
- [ ] 13.14 Write property test for database integrity and constraints (Property 14)
- [ ] 13.15 Write property test for rate limiting and abuse prevention (Property 15)
- [ ] 13.16 Write property test for comprehensive audit logging (Property 16)

### Task 14: Integration Tests and End-to-End Validation
**Requirements:** Complete system integration validation
- [ ] 14.1 Write integration tests for complete authentication flows
- [ ] 14.2 Write integration tests for multi-tenant data isolation
- [ ] 14.3 Write integration tests for role-based access control
- [ ] 14.4 Write integration tests for OTP generation and verification
- [ ] 14.5 Write integration tests for context switching scenarios
- [ ] 14.6 Write end-to-end tests for all user authentication journeys

## Phase 7: Migration and Deployment

### Task 15: Data Migration and Cleanup
**Requirements:** Seamless transition from existing system
- [ ] 15.1 Create migration script for existing user data to new schema
- [ ] 15.2 Migrate existing UserSchool relationships to use proper roles
- [ ] 15.3 Create default school contexts for existing users
- [ ] 15.4 Migrate existing parent-student relationships
- [ ] 15.5 Clean up deprecated authentication code
- [ ] 15.6 Update environment variables and configuration

### Task 16: Documentation and Deployment
**Requirements:** Production readiness and maintainability
- [ ] 16.1 Create API documentation for new authentication endpoints
- [ ] 16.2 Write deployment guide for new authentication system
- [ ] 16.3 Create troubleshooting guide for common authentication issues
- [ ] 16.4 Update user guides for new login experience
- [ ] 16.5 Create monitoring and alerting for authentication system
- [ ] 16.6 Perform final security review and penetration testing

## Notes

- Each task should be completed in order within its phase
- Property-based tests should use fast-check library with minimum 100 iterations
- All authentication events must be logged for audit purposes
- Rate limiting must be implemented at both service and middleware levels
- Multi-tenant data isolation is critical and must be validated at every level
- Super admin authentication must have additional security measures
- All existing functionality must continue to work during migration