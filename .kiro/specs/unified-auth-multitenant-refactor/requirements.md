# Requirements Document

## Introduction

This document specifies the requirements for refactoring the existing School ERP SaaS into a production-grade multi-tenant system with unified authentication. The system will transform from a single shared login architecture to a comprehensive role-based authentication system that supports multiple schools, roles, and authentication methods while maintaining strict tenant isolation.

## Glossary

- **System**: The School ERP SaaS application
- **Unified_Auth_System**: The single authentication system handling all user types
- **School_Context**: The active school environment for a user session
- **Role_Router**: Component that routes users to appropriate dashboards based on role
- **Tenant_Isolation**: Security mechanism ensuring schools cannot access each other's data
- **OTP_Service**: One-time password generation and verification service
- **Setup_Wizard**: Per-school onboarding flow
- **Super_Admin**: System-wide administrator with full control
- **School_Admin**: Administrator for a specific school
- **Multi_School_User**: User with access to multiple schools
- **Parent_Context**: Session state for parents managing multiple children

## Requirements

### Requirement 1: Unified Authentication System

**User Story:** As any school user (student, parent, teacher, admin), I want to use a single login system, so that there is one consistent entry point regardless of my role.

#### Acceptance Criteria

1. THE System SHALL provide exactly one login page for all school-based user types
2. WHEN a school user accesses any protected route, THE System SHALL redirect to the unified login page
3. THE System SHALL NOT create separate login pages for different school-based roles
4. THE System SHALL NOT allow users to select their role during login
5. THE System SHALL automatically determine authentication method based on user's role in database

### Requirement 2: School Context Resolution

**User Story:** As a user, I want the system to identify my school context before authentication, so that I can access the correct school's data.

#### Acceptance Criteria

1. WHEN a user visits the login page, THE System SHALL prompt for school code first
2. WHEN a school code is entered, THE System SHALL validate the school exists and is active
3. IF a school code is invalid or inactive, THEN THE System SHALL display an error and prevent login
4. WHEN a valid school code is provided, THE System SHALL load the school context into the authentication flow
5. THE System SHALL store the school context securely throughout the authentication process

### Requirement 3: Role-Based Authentication Methods

**User Story:** As the system, I want to apply different authentication methods based on user roles, so that security requirements are appropriate for each user type.

#### Acceptance Criteria

1. WHEN a student authenticates, THE System SHALL use mobile OTP verification only
2. WHEN a parent authenticates, THE System SHALL use mobile OTP verification only
3. WHEN a teacher authenticates, THE System SHALL support both OTP and password authentication
4. WHEN a school admin authenticates, THE System SHALL use password authentication with optional OTP
5. THE System SHALL automatically determine authentication method without user selection

### Requirement 3A: Super Admin Separate Authentication

**User Story:** As a super admin, I want a dedicated secure login route, so that I can access system administration without going through school-based authentication flow.

#### Acceptance Criteria

1. THE System SHALL provide a separate super admin login page at /sd route
2. WHEN a super admin accesses /sd, THE System SHALL prompt for email and password only
3. WHEN super admin credentials are validated, THE System SHALL redirect to /super-admin dashboard
4. THE System SHALL NOT require school code for super admin authentication
5. THE System SHALL implement additional security measures for super admin login route

### Requirement 4: OTP Service Implementation

**User Story:** As a user requiring OTP authentication, I want to receive secure one-time passwords, so that I can authenticate safely without remembering complex passwords.

#### Acceptance Criteria

1. WHEN OTP is required, THE System SHALL generate a secure 6-digit numeric code
2. WHEN OTP is generated, THE System SHALL set expiration time between 2-5 minutes
3. WHEN OTP is sent, THE System SHALL store hashed version in database with attempt counter
4. WHEN OTP verification fails, THE System SHALL increment attempt counter
5. WHEN OTP attempts exceed 3 failures, THE System SHALL temporarily block the identifier
6. WHEN OTP expires, THE System SHALL reject verification and require new OTP generation
7. THE System SHALL implement rate limiting to prevent OTP abuse

### Requirement 5: Multi-School User Support

**User Story:** As a user with access to multiple schools, I want to select which school context to work in, so that I can manage my responsibilities across different institutions.

#### Acceptance Criteria

1. WHEN a user belongs to multiple schools, THE System SHALL display school selection after authentication
2. WHEN a school is selected, THE System SHALL store the active school context in the user session
3. WHEN a user switches schools, THE System SHALL update the session context without requiring re-authentication
4. THE System SHALL validate user has access to the selected school before allowing context switch
5. THE System SHALL maintain separate session data for each school context

### Requirement 6: Parent Multi-Child Management

**User Story:** As a parent with multiple children, I want to manage different children's information, so that I can access relevant data for each child.

#### Acceptance Criteria

1. WHEN a parent mobile number is linked to multiple students, THE System SHALL display child selection after login
2. WHEN a child is selected, THE System SHALL store the active student context in the parent session
3. WHEN a parent switches between children, THE System SHALL update the active student context
4. THE System SHALL display child information including name and class in selection interface
5. THE System SHALL allow parents to switch active child context without re-authentication

### Requirement 7: Role-Based Dashboard Routing

**User Story:** As an authenticated user, I want to be automatically directed to my appropriate dashboard, so that I can access relevant functionality immediately.

#### Acceptance Criteria

1. WHEN a student completes authentication, THE System SHALL redirect to /student/dashboard
2. WHEN a parent completes authentication, THE System SHALL redirect to /parent/dashboard
3. WHEN a teacher completes authentication, THE System SHALL redirect to /teacher/dashboard
4. WHEN a school admin completes authentication, THE System SHALL redirect to /admin/dashboard
5. WHEN a super admin completes authentication via /sd, THE System SHALL redirect to /super-admin
6. THE System SHALL prevent users from accessing dashboards not matching their role

### Requirement 8: Tenant Data Isolation

**User Story:** As a school administrator, I want my school's data to be completely isolated from other schools, so that privacy and security are maintained.

#### Acceptance Criteria

1. WHEN any database query is executed, THE System SHALL filter results by the active school context
2. WHEN API endpoints are accessed, THE System SHALL validate school context matches user permissions
3. THE System SHALL reject requests attempting to access data from unauthorized schools
4. WHEN URL parameters contain school identifiers, THE System SHALL validate against user's authorized schools
5. THE System SHALL log and alert on attempts to access unauthorized school data

### Requirement 9: Setup Wizard Per-School Implementation

**User Story:** As a super admin, I want to manage onboarding for each school independently, so that new schools can be configured without affecting existing ones.

#### Acceptance Criteria

1. WHEN a school is created, THE System SHALL set isOnboarded flag to false
2. WHEN a school admin first accesses their dashboard, THE System SHALL redirect to setup wizard if not onboarded
3. WHEN setup wizard is completed, THE System SHALL set isOnboarded flag to true
4. WHEN a super admin resets onboarding, THE System SHALL set isOnboarded flag to false and clear onboarding progress
5. THE System SHALL track onboarding progress per school independently

### Requirement 10: Super Admin Control Panel

**User Story:** As a super admin, I want comprehensive control over all schools and users, so that I can manage the entire SaaS platform effectively.

#### Acceptance Criteria

1. THE Super_Admin SHALL create new schools with unique school codes
2. THE Super_Admin SHALL activate or suspend school accounts
3. THE Super_Admin SHALL assign subscription plans and usage limits to schools
4. THE Super_Admin SHALL launch or reset setup wizards for any school
5. THE Super_Admin SHALL manage user accounts across all schools
6. THE Super_Admin SHALL view usage analytics and payment status for all schools
7. THE Super_Admin SHALL have emergency access to disable any school or user account

### Requirement 11: Session and JWT Security

**User Story:** As the system, I want to maintain secure user sessions with proper context, so that authentication state is preserved and validated correctly.

#### Acceptance Criteria

1. WHEN a user authenticates, THE System SHALL create a JWT token containing user ID, role, and authorized school IDs
2. WHEN a school context is selected, THE System SHALL update the session with active school ID
3. WHEN API requests are made, THE System SHALL validate JWT token and extract user context
4. WHEN sessions expire, THE System SHALL redirect users to login and clear all context
5. THE System SHALL implement secure token refresh mechanism for long-lived sessions

### Requirement 12: Authentication Middleware Protection

**User Story:** As the system, I want to protect all routes with appropriate authentication checks, so that unauthorized access is prevented.

#### Acceptance Criteria

1. WHEN protected routes are accessed, THE System SHALL verify valid authentication token
2. WHEN role-specific routes are accessed, THE System SHALL validate user has required role
3. WHEN school-specific routes are accessed, THE System SHALL validate user has access to that school
4. WHEN super admin routes are accessed, THE System SHALL enforce additional security checks
5. THE System SHALL log all authentication failures and suspicious access attempts

### Requirement 13: Database Schema Multi-Tenancy

**User Story:** As a developer, I want a database schema that supports multi-tenancy with proper relationships, so that data integrity and isolation are maintained.

#### Acceptance Criteria

1. THE System SHALL implement User model with nullable mobile and email fields
2. THE System SHALL implement UserSchool junction table for many-to-many user-school relationships
3. THE System SHALL implement School model with unique school codes and onboarding status
4. THE System SHALL implement Student model linked to schools and parent mobile numbers
5. THE System SHALL implement OTP model for secure code storage and verification
6. THE System SHALL enforce foreign key constraints to maintain data integrity

### Requirement 14: Rate Limiting and Abuse Protection

**User Story:** As the system, I want to prevent authentication abuse and attacks, so that the service remains available and secure.

#### Acceptance Criteria

1. WHEN OTP requests are made, THE System SHALL limit requests to 3 per mobile number per 5-minute window
2. WHEN login attempts fail, THE System SHALL implement exponential backoff for repeated failures
3. WHEN suspicious activity is detected, THE System SHALL temporarily block the source
4. THE System SHALL log all rate limiting events for security monitoring
5. THE System SHALL provide admin interface to review and manage blocked identifiers

### Requirement 15: Audit Trail and Logging

**User Story:** As a super admin, I want comprehensive logging of authentication events, so that I can monitor system security and troubleshoot issues.

#### Acceptance Criteria

1. WHEN users log in, THE System SHALL log successful authentication with timestamp and context
2. WHEN authentication fails, THE System SHALL log failure reason and source information
3. WHEN school context switches occur, THE System SHALL log the context change
4. WHEN administrative actions are performed, THE System SHALL log the action and administrator
5. THE System SHALL provide searchable audit logs with filtering capabilities