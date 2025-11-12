# Fee Management Infrastructure

This directory contains the core infrastructure for the parent dashboard fee management system.

## Overview

The fee management infrastructure provides:
- **Validation Schemas**: Zod schemas for validating fee operations
- **TypeScript Types**: Type definitions for fee data structures
- **Error Handling**: Utilities for handling payment-related errors
- **Helper Functions**: Utility functions for fee calculations and formatting

## Files

### 1. `parent-fee-schemas.ts`
Location: `src/lib/schemaValidation/parent-fee-schemas.ts`

Contains Zod validation schemas for all fee-related operations:
- `feeOverviewSchema` - Validates fee overview requests
- `paymentHistoryFilterSchema` - Validates payment history filters with pagination
- `createPaymentSchema` - Validates payment creation data
- `paymentGatewayOrderSchema` - Validates payment gateway order creation
- `verifyPaymentSchema` - Validates payment verification data
- `downloadReceiptSchema` - Validates receipt download requests
- `feeBreakdownSchema` - Schema for fee breakdown response
- `paymentRecordSchema` - Schema for payment record response

### 2. `fees.ts`
Location: `src/lib/types/fees.ts`

TypeScript type definitions for fee management:
- `FeeOverview` - Complete fee overview with breakdown
- `FeeBreakdownItem` - Individual fee item details
- `PaymentHistoryItem` - Payment record with details
- `PaymentGatewayOrder` - Payment gateway order data
- `ReceiptData` - Receipt information for PDF generation
- `FeeError` - Standardized error structure
- `FeeErrorCode` - Enum of all possible error codes

### 3. `payment-error-handler.ts`
Location: `src/lib/utils/payment-error-handler.ts`

Error handling utilities for payment operations:
- `PaymentError` - Custom error class for payment errors
- `handlePaymentError()` - Converts any error to standardized FeeError
- `createXxxError()` - Factory functions for specific error types
- `logPaymentError()` - Logs errors with context
- `formatErrorMessage()` - Formats errors for user display
- `isRetryableError()` - Checks if error can be retried
- `withPaymentErrorHandling()` - Wraps async operations with error handling

### 4. `payment-helpers.ts`
Location: `src/lib/utils/payment-helpers.ts`

Helper functions for fee calculations and formatting:
- `calculateFeeItemStatus()` - Determines fee item status (PAID, PENDING, OVERDUE, PARTIAL)
- `formatPaymentMethod()` - Formats payment method for display
- `formatPaymentStatus()` - Formats payment status for display
- `getStatusColor()` - Returns Tailwind classes for status colors
- `calculateTotalBalance()` - Calculates total balance from fee items
- `findNextDueDate()` - Finds next upcoming due date
- `hasOverdueFees()` - Checks for overdue fees
- `validatePaymentAmount()` - Validates payment amount
- `formatCurrency()` - Formats amount as currency
- `generateReceiptNumber()` - Generates unique receipt numbers

### 5. `fee-management.ts`
Location: `src/lib/utils/fee-management.ts`

Central export file for all fee management utilities. Import from this file for convenience:

```typescript
import {
  // Error handling
  PaymentError,
  handlePaymentError,
  createPaymentFailedError,
  
  // Helper functions
  calculateFeeItemStatus,
  formatCurrency,
  validatePaymentAmount,
  
  // Schemas
  createPaymentSchema,
  verifyPaymentSchema,
  
  // Types
  FeeOverview,
  PaymentHistoryItem,
  FeeErrorCode,
} from "@/lib/utils/fee-management";
```

## Usage Examples

### 1. Validating Payment Data

```typescript
import { createPaymentSchema } from "@/lib/utils/fee-management";

const result = createPaymentSchema.safeParse({
  childId: "child_123",
  feeStructureId: "fee_456",
  amount: 5000,
  paymentMethod: "ONLINE_PAYMENT",
  feeTypeIds: ["type_1", "type_2"],
});

if (!result.success) {
  console.error(result.error.errors);
}
```

### 2. Handling Errors

```typescript
import { 
  withPaymentErrorHandling, 
  createPaymentFailedError 
} from "@/lib/utils/fee-management";

const result = await withPaymentErrorHandling(
  async () => {
    // Your payment operation
    const payment = await processPayment(data);
    return payment;
  },
  "processPayment"
);

if (!result.success) {
  console.error(result.error.message);
}
```

### 3. Calculating Fee Status

```typescript
import { 
  calculateFeeItemStatus,
  hasOverdueFees,
  calculateOverdueAmount 
} from "@/lib/utils/fee-management";

const status = calculateFeeItemStatus(
  5000,  // total amount
  2000,  // paid amount
  new Date("2024-10-01")  // due date
);

console.log(status); // "OVERDUE" or "PARTIAL" or "PAID" or "PENDING"
```

### 4. Formatting for Display

```typescript
import { 
  formatCurrency,
  formatPaymentMethod,
  getStatusColor 
} from "@/lib/utils/fee-management";

const amount = formatCurrency(5000); // "₹5,000.00"
const method = formatPaymentMethod("ONLINE_PAYMENT"); // "Online Payment"
const color = getStatusColor("OVERDUE"); // "text-red-600 bg-red-50"
```

## Error Codes

All payment errors use standardized error codes from `FeeErrorCode`:

- `UNAUTHORIZED` - User doesn't have permission
- `INVALID_CHILD` - Invalid or unauthorized child ID
- `INVALID_FEE_STRUCTURE` - Invalid fee structure ID
- `PAYMENT_FAILED` - Payment processing failed
- `PAYMENT_VERIFICATION_FAILED` - Payment verification failed
- `RECEIPT_NOT_FOUND` - Receipt not found
- `INVALID_AMOUNT` - Invalid payment amount
- `DATABASE_ERROR` - Database operation failed
- `VALIDATION_ERROR` - Input validation failed
- `PAYMENT_GATEWAY_ERROR` - Payment gateway error

## Best Practices

1. **Always validate input data** using the provided Zod schemas
2. **Use error handling utilities** to ensure consistent error responses
3. **Log errors** with context using `logPaymentError()`
4. **Format user-facing messages** using `formatErrorMessage()`
5. **Check for retryable errors** using `isRetryableError()`
6. **Use helper functions** for calculations to ensure consistency
7. **Import from fee-management.ts** for cleaner imports

## Requirements Coverage

This infrastructure supports the following requirements:

- **Requirement 1.1**: Fee overview with breakdown and status
- **Requirement 1.2**: Payment history with filtering and pagination
- **Requirement 1.3**: Payment creation and verification
- **Requirement 1.4**: Overdue fee alerts and notifications
- **Requirement 1.5**: Receipt generation and email confirmation

## Next Steps

After this infrastructure is in place, the next tasks will be:
1. Implement server actions using these utilities
2. Integrate payment gateway (Razorpay)
3. Build UI components for fee display
4. Create fee management pages
