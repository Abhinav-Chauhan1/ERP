# Enhanced Syllabus System - Authorization Implementation

## Overview

This document describes the comprehensive role-based access control (RBAC) implementation for the Enhanced Syllabus System. Authorization checks have been added to all server actions to ensure proper access control based on user roles.

## Implementation Date

December 25, 2025

## Authorization Architecture

### Core Authorization Utility

**File**: `src/lib/utils/syllabus-authorization.ts`

This utility provides centralized authorization functions that are used across all syllabus-related server actions.

### Key Functions

#### 1. `getCurrentUser()`
- Base function for all authorization checks
- Retrieves authenticated user from Clerk
- Fetches user role from database
- Returns authorization result with user data

#### 2. `requireAdmin()`
- Ensures user has admin role
- Used for all CRUD operations on modules, sub-modules, and documents
- **Requirements**: 1.1-1.5, 2.1-2.5, 3.1-3.6, 4.1-4.5, 8.1-8.3, 9.1-9.4

#### 3. `requireTeacher()`
- Ensures user has teacher role
- Used for progress tracking operations
- **Requirements**: 5.1-5.5, 10.1-10.5

#### 4. `requireStudent()`
- Ensures user has student role
- Used for student-specific read-only operations
- **Requirements**: 6.1-6.5

#### 5. `requireAdminOrTeacher()`
- Allows both admin and teacher roles
- Used for operations accessible to both roles

#### 6. `requireViewAccess()`
- Allows admin, teacher, and student roles
- Used for read-only operations (viewing syllabus content)
- **Requirements**: 5.1-5.5, 6.1-6.5

#### 7. `requireModifyAccess()`
- Alias for `requireAdmin()`
- Explicitly indicates modification operations
- **Requirements**: 1.1-1.5, 2.1-2.5, 3.1-3.6, 4.1-4.5, 8.1-8.3, 9.1-9.4

#### 8. `requireProgressTrackingAccess()`
- Alias for `requireTeacher()`
- Explicitly indicates progress tracking operations
- **Requirements**: 10.1-10.5

#### 9. `verifyTeacherOwnership(teacherId)`
- Ensures teachers can only access their own progress
- Prevents teachers from modifying other teachers' progress
- **Requirements**: 10.1-10.5

#### 10. `formatAuthError(authResult)`
- Helper function to format authorization errors
- Provides consistent error responses

## Authorization by Operation Type

### Module Management (Admin Only)

**Operations**:
- `createModule()` - Create new modules
- `updateModule()` - Update existing modules
- `deleteModule()` - Delete modules with cascade
- `reorderModules()` - Reorder modules via drag-and-drop

**Authorization**: `requireModifyAccess()` (Admin only)

**Requirements**: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1

### Sub-Module Management (Admin Only)

**Operations**:
- `createSubModule()` - Create new sub-modules
- `updateSubModule()` - Update existing sub-modules
- `deleteSubModule()` - Delete sub-modules with cascade
- `moveSubModule()` - Move sub-modules between modules
- `reorderSubModules()` - Reorder sub-modules via drag-and-drop

**Authorization**: `requireModifyAccess()` (Admin only)

**Requirements**: 2.1, 2.2, 2.3, 2.4, 2.5, 8.2, 8.3

### Document Management (Admin Only)

**Operations**:
- `uploadDocument()` - Upload single document
- `bulkUploadDocuments()` - Upload multiple documents
- `updateDocumentMetadata()` - Update document title/description
- `deleteDocument()` - Delete document with storage cleanup
- `reorderDocuments()` - Reorder documents

**Authorization**: `requireModifyAccess()` (Admin only)

**Requirements**: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.4, 4.5, 9.1, 9.3, 9.4

### Progress Tracking (Teacher Only)

**Operations**:
- `markSubModuleComplete()` - Mark sub-module as complete/incomplete

**Authorization**: `verifyTeacherOwnership(teacherId)` (Teacher can only mark their own progress)

**Requirements**: 10.1, 10.5

### View Operations (All Authenticated Users)

**Operations**:
- `getModulesBySyllabus()` - View all modules in a syllabus
- `getSubModulesByModule()` - View all sub-modules in a module
- `getDocumentsByParent()` - View all documents
- `getModuleProgress()` - View module progress
- `getSyllabusProgress()` - View syllabus progress
- `getBatchModuleProgress()` - View progress for multiple modules

**Authorization**: `requireViewAccess()` (Admin, Teacher, or Student)

**Requirements**: 1.4, 2.2, 2.5, 3.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 10.2, 10.3, 10.4

## Middleware Integration

### Route-Level Permissions

**File**: `src/lib/utils/permission-middleware.ts`

Added route patterns for syllabus operations:

```typescript
// Module Management Routes
{ pattern: /^\/admin\/academic\/syllabus\/modules\/create/, resource: 'MODULE', action: 'CREATE', roles: [UserRole.ADMIN] }
{ pattern: /^\/admin\/academic\/syllabus\/modules\/\w+\/edit/, resource: 'MODULE', action: 'UPDATE', roles: [UserRole.ADMIN] }
{ pattern: /^\/admin\/academic\/syllabus\/modules\/\w+\/delete/, resource: 'MODULE', action: 'DELETE', roles: [UserRole.ADMIN] }

// Sub-Module Management Routes
{ pattern: /^\/admin\/academic\/syllabus\/sub-modules\/create/, resource: 'SUBMODULE', action: 'CREATE', roles: [UserRole.ADMIN] }
{ pattern: /^\/admin\/academic\/syllabus\/sub-modules\/\w+\/edit/, resource: 'SUBMODULE', action: 'UPDATE', roles: [UserRole.ADMIN] }
{ pattern: /^\/admin\/academic\/syllabus\/sub-modules\/\w+\/delete/, resource: 'SUBMODULE', action: 'DELETE', roles: [UserRole.ADMIN] }

// Document Management Routes
{ pattern: /^\/admin\/academic\/syllabus\/documents\/upload/, resource: 'DOCUMENT', action: 'CREATE', roles: [UserRole.ADMIN] }
{ pattern: /^\/admin\/academic\/syllabus\/documents\/\w+\/edit/, resource: 'DOCUMENT', action: 'UPDATE', roles: [UserRole.ADMIN] }
{ pattern: /^\/admin\/academic\/syllabus\/documents\/\w+\/delete/, resource: 'DOCUMENT', action: 'DELETE', roles: [UserRole.ADMIN] }

// Progress Tracking Routes
{ pattern: /^\/teacher\/teaching\/syllabus\/progress/, resource: 'PROGRESS', action: 'UPDATE', roles: [UserRole.TEACHER] }
```

## Error Handling

### Authorization Error Codes

- `UNAUTHENTICATED` - User is not authenticated
- `USER_NOT_FOUND` - User not found in database
- `FORBIDDEN` - User does not have required role
- `AUTH_ERROR` - General authentication error

### Error Response Format

```typescript
{
  success: false,
  error: "Error message",
  code: "ERROR_CODE"
}
```

## Testing

### Test File

**File**: `src/lib/actions/__tests__/syllabus-authorization.test.ts`

### Test Coverage

- ✅ 28 tests passing
- ✅ All authorization functions tested
- ✅ All role combinations tested
- ✅ Edge cases covered (unauthenticated, not found, wrong role)

### Test Results

```
✓ getCurrentUser (3 tests)
✓ requireAdmin (3 tests)
✓ requireTeacher (3 tests)
✓ requireStudent (3 tests)
✓ requireAdminOrTeacher (3 tests)
✓ requireViewAccess (4 tests)
✓ requireModifyAccess (3 tests)
✓ requireProgressTrackingAccess (3 tests)
✓ verifyTeacherOwnership (3 tests)
```

## Security Considerations

### 1. Defense in Depth

Authorization is enforced at multiple layers:
- **Middleware Layer**: Route-level access control
- **Server Action Layer**: Function-level authorization checks
- **Database Layer**: Prisma queries with proper filtering

### 2. Principle of Least Privilege

Each role has minimal necessary permissions:
- **Admin**: Full CRUD on all syllabus entities
- **Teacher**: Read access + progress tracking (own progress only)
- **Student**: Read-only access to syllabus content

### 3. Ownership Verification

Teachers can only modify their own progress:
- `verifyTeacherOwnership()` ensures teacher ID matches authenticated user
- Prevents cross-teacher data manipulation

### 4. Consistent Error Messages

All authorization failures return consistent error format:
- Prevents information leakage
- Provides clear feedback for debugging

## Usage Examples

### Admin Creating a Module

```typescript
// In admin UI component
const result = await createModule({
  title: "Chapter 1: Introduction",
  description: "Basic concepts",
  chapterNumber: 1,
  order: 1,
  syllabusId: "syllabus-123"
});

// Authorization check happens automatically
// Only admins can successfully create modules
```

### Teacher Marking Progress

```typescript
// In teacher UI component
const result = await markSubModuleComplete({
  subModuleId: "submodule-123",
  teacherId: currentUser.id, // Must match authenticated user
  completed: true
});

// Authorization check verifies:
// 1. User is a teacher
// 2. Teacher ID matches authenticated user
```

### Student Viewing Syllabus

```typescript
// In student UI component
const result = await getModulesBySyllabus("syllabus-123");

// Authorization check allows:
// - Admin (can view)
// - Teacher (can view)
// - Student (can view)
```

## Files Modified

### Core Authorization
- ✅ `src/lib/utils/syllabus-authorization.ts` (NEW)

### Server Actions
- ✅ `src/lib/actions/moduleActions.ts`
- ✅ `src/lib/actions/subModuleActions.ts`
- ✅ `src/lib/actions/syllabusDocumentActions.ts`
- ✅ `src/lib/actions/progressTrackingActions.ts`

### Middleware
- ✅ `src/lib/utils/permission-middleware.ts`

### Tests
- ✅ `src/lib/actions/__tests__/syllabus-authorization.test.ts` (NEW)

## Requirements Coverage

### Admin Operations (Requirements 1.1-1.5, 2.1-2.5, 3.1-3.6, 4.1-4.5, 8.1-8.3, 9.1-9.4)
✅ All CRUD operations protected with admin-only authorization

### Teacher Operations (Requirements 5.1-5.5, 10.1-10.5)
✅ View access granted
✅ Progress tracking with ownership verification

### Student Operations (Requirements 6.1-6.5)
✅ Read-only access to syllabus content
✅ Cannot modify any data

## Next Steps

1. **UI Integration**: Update UI components to handle authorization errors gracefully
2. **Loading States**: Add loading indicators during authorization checks
3. **Error Boundaries**: Implement error boundaries for authorization failures
4. **Audit Logging**: Consider adding audit logs for authorization failures
5. **Rate Limiting**: Add rate limiting for repeated authorization failures

## Conclusion

The authorization implementation provides comprehensive role-based access control for the Enhanced Syllabus System. All server actions are now protected with appropriate authorization checks, ensuring that:

- Admins have full control over syllabus structure
- Teachers can view content and track their own progress
- Students have read-only access to learning materials
- All operations are properly secured and tested

The implementation follows security best practices and provides a solid foundation for the syllabus system's access control requirements.
