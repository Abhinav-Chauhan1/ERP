# Promotion Server Actions Implementation

## Overview

This document describes the implementation of server actions for the Student Promotion and Alumni Management feature.

## Files Created

### 1. `src/lib/schemas/promotionSchemas.ts`

Validation schemas for promotion operations using Zod:

- `getStudentsForPromotionSchema` - Validates input for fetching students
- `promotionPreviewSchema` - Validates promotion preview requests
- `bulkPromotionSchema` - Validates bulk promotion execution
- `promotionHistoryFiltersSchema` - Validates history filters
- `promotionDetailsSchema` - Validates promotion detail requests
- `promotionRollbackSchema` - Validates rollback requests

All schemas include proper validation rules and type exports.

### 2. `src/lib/actions/promotionActions.ts`

Server actions for promotion operations with authentication and authorization:

#### Actions Implemented

1. **`getStudentsForPromotion()`**
   - Fetches students eligible for promotion from a class/section
   - Filters by active enrollment status
   - Supports optional academic year filtering
   - Requirements: 1.1, 14.1, 14.5

2. **`previewPromotion()`**
   - Previews promotion with validation and warnings
   - Checks eligibility and potential issues
   - Returns warnings for unpaid fees, low attendance, etc.
   - Requirements: 2.1, 2.2, 14.1, 14.5

3. **`executeBulkPromotion()`**
   - Executes bulk promotion in a database transaction
   - Creates new enrollments with ACTIVE status
   - Updates old enrollments to GRADUATED status
   - Creates alumni profiles automatically
   - Sends notifications to students and parents
   - Handles partial failures gracefully
   - Creates promotion history and records
   - Includes audit logging
   - Requirements: 1.3, 1.4, 1.5, 1.6, 8.1, 8.2, 8.3, 14.4

4. **`getPromotionHistory()`**
   - Fetches promotion history with filters
   - Supports pagination
   - Filters by academic year, class, date range
   - Requirements: 8.4, 8.5

5. **`getPromotionDetails()`**
   - Fetches detailed promotion information
   - Includes student list with statuses
   - Shows failure details and excluded students
   - Requirements: 8.5

6. **`rollbackPromotion()`**
   - Rolls back a promotion (within 24 hours only)
   - Reverses all changes in a transaction
   - Deletes new enrollments
   - Restores old enrollments to ACTIVE
   - Deletes alumni profiles created during promotion
   - Includes audit logging
   - Requirements: 8.6

## Security Features

### Authentication & Authorization

All actions include:
- Session authentication check using NextAuth v5
- ADMIN role verification
- Unauthorized access returns appropriate error messages

### Audit Logging

All promotion operations are logged with:
- Action type
- User ID
- Timestamp
- Operation details (students affected, classes, etc.)

### Input Validation

All inputs are validated using Zod schemas:
- Type safety
- Required field checks
- Format validation
- Length constraints

## Error Handling

Comprehensive error handling includes:
- Try-catch blocks for all operations
- Graceful handling of partial failures
- Detailed error messages
- Transaction rollback on critical errors
- Logging of all errors

## Database Transactions

Critical operations use Prisma transactions:
- Bulk promotion execution
- Promotion rollback
- Alumni profile creation
- Ensures data consistency

## Integration with Existing Services

### PromotionService

Actions integrate with the PromotionService class:
- `validatePromotion()` - Validates eligibility
- `checkPromotionWarnings()` - Checks for warnings
- `generateRollNumbers()` - Generates roll numbers
- `executePromotion()` - Executes promotion logic
- `createAlumniProfiles()` - Creates alumni records
- `sendPromotionNotifications()` - Sends notifications

### Notification System

Notifications are sent asynchronously:
- Non-blocking operation
- Failures don't affect promotion success
- Supports email, SMS, and WhatsApp channels

## Path Revalidation

After successful operations, the following paths are revalidated:
- `/admin/academic/promotion`
- `/admin/academic/promotion/history`
- `/admin/alumni`

## Type Safety

All actions include:
- TypeScript type definitions
- Zod schema validation
- Type exports for client usage
- Proper return types

## Testing Considerations

The implementation is designed for testability:
- Pure functions where possible
- Dependency injection ready
- Clear separation of concerns
- Comprehensive error handling

## Next Steps

1. Implement property-based tests (tasks 6.3, 6.5, 6.6)
2. Create UI components for promotion management
3. Add integration tests for complete workflows
4. Implement alumni management actions (task 8)

## Requirements Coverage

This implementation satisfies the following requirements:
- 1.1: Display students for promotion
- 1.3: Bulk promotion execution
- 1.4: Create new enrollments
- 1.5: Update old enrollments to GRADUATED
- 1.6: Generate promotion summary
- 2.1: Preview promotion changes
- 2.2: Display promotion preview
- 8.1: Create promotion history record
- 8.2: Store promotion details
- 8.3: Store student counts
- 8.4: View promotion history
- 8.5: View detailed promotion information
- 8.6: Rollback promotion
- 14.1: Restrict to ADMIN role
- 14.4: Audit logging
- 14.5: Authorization checks

## Notes

- All actions follow the existing codebase patterns
- Uses NextAuth v5 for authentication
- Compatible with Prisma ORM
- Follows TypeScript best practices
- Includes comprehensive JSDoc comments
