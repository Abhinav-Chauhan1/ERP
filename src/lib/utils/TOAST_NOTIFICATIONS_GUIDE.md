# Toast Notifications Guide

This guide explains how to use toast notifications in the Parent Dashboard for providing user feedback.

## Overview

Toast notifications are used throughout the application to provide immediate feedback to users about their actions. We use `react-hot-toast` library with custom utility functions for consistent styling and behavior.

## Requirements Coverage

- **Requirement 9.4**: Toast notifications for all successful operations, failed operations, and important events

## Available Toast Types

### 1. Success Toast
Use for successful operations (save, update, delete, etc.)

```typescript
import { showSuccessToast } from '@/lib/utils/toast-utils';

showSuccessToast('Profile updated successfully!');
```

### 2. Error Toast
Use for failed operations or errors

```typescript
import { showErrorToast } from '@/lib/utils/toast-utils';

showErrorToast('Failed to save changes. Please try again.');
```

### 3. Info Toast
Use for informational messages

```typescript
import { showInfoToast } from '@/lib/utils/toast-utils';

showInfoToast('Your session will expire in 5 minutes.');
```

### 4. Warning Toast
Use for warnings that need user attention

```typescript
import { showWarningToast } from '@/lib/utils/toast-utils';

showWarningToast('Please save your changes before leaving.');
```

### 5. Loading Toast
Use for long-running operations

```typescript
import { showLoadingToast, dismissToast } from '@/lib/utils/toast-utils';

const toastId = showLoadingToast('Processing payment...');

// Later, dismiss the toast
dismissToast(toastId);
showSuccessToast('Payment completed!');
```

### 6. Promise Toast
Use for async operations with automatic state management

```typescript
import { showPromiseToast } from '@/lib/utils/toast-utils';

const promise = fetch('/api/data').then(res => res.json());

showPromiseToast(promise, {
  loading: 'Loading data...',
  success: 'Data loaded successfully!',
  error: 'Failed to load data',
});
```

## Custom Toast Functions

### Payment Success Toast
```typescript
import { showPaymentSuccessToast } from '@/lib/utils/toast-utils';

showPaymentSuccessToast(5000, 'RCP-2024-001234');
// Shows: "Payment of ₹5000.00 successful! Receipt: RCP-2024-001234"
```

### Validation Error Toast
```typescript
import { showValidationErrorToast } from '@/lib/utils/toast-utils';

showValidationErrorToast([
  'Email is required',
  'Password must be at least 8 characters'
]);
```

### Meeting Confirmation Toast
```typescript
import { showMeetingConfirmationToast } from '@/lib/utils/toast-utils';

showMeetingConfirmationToast('Mr. John Smith', 'March 15, 2024 at 10:00 AM');
```

### Event Registration Toast
```typescript
import { showEventRegistrationToast } from '@/lib/utils/toast-utils';

showEventRegistrationToast('Annual Sports Day 2024');
```

## Usage in Server Actions

Server actions should return success/error states, and the client component should handle the toast:

```typescript
// Server Action (parent-fee-actions.ts)
export async function createPayment(data: CreatePaymentInput) {
  try {
    // ... payment logic
    return { 
      success: true, 
      message: 'Payment completed successfully',
      data: payment 
    };
  } catch (error) {
    return { 
      success: false, 
      message: 'Payment failed. Please try again.' 
    };
  }
}

// Client Component
'use client';

import { showSuccessToast, showErrorToast } from '@/lib/utils/toast-utils';

const handlePayment = async () => {
  const result = await createPayment(paymentData);
  
  if (result.success) {
    showSuccessToast(result.message);
  } else {
    showErrorToast(result.message);
  }
};
```

## Usage in Forms

For form submissions with validation:

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { showSuccessToast, showErrorToast, showValidationErrorToast } from '@/lib/utils/toast-utils';

const onSubmit = async (values: FormValues) => {
  try {
    const result = await submitForm(values);
    
    if (result.success) {
      showSuccessToast('Form submitted successfully!');
      reset(); // Reset form
    } else {
      showErrorToast(result.message);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      showValidationErrorToast(error.errors.map(e => e.message));
    } else {
      showErrorToast('An unexpected error occurred');
    }
  }
};
```

## Best Practices

1. **Be Specific**: Use clear, specific messages
   - ✅ "Payment of ₹5000 completed successfully"
   - ❌ "Success"

2. **Provide Context**: Include relevant information
   - ✅ "Meeting with Mr. Smith scheduled for March 15"
   - ❌ "Meeting scheduled"

3. **Handle Errors Gracefully**: Show actionable error messages
   - ✅ "Failed to save. Please check your internet connection."
   - ❌ "Error"

4. **Use Appropriate Duration**:
   - Success: 4 seconds (default)
   - Error: 5 seconds (default)
   - Info/Warning: 4 seconds (default)
   - Loading: Until dismissed

5. **Don't Overuse**: Only show toasts for important user actions
   - ✅ Form submission, payment, data save
   - ❌ Every button click, hover, or minor interaction

6. **Consistent Positioning**: All toasts appear at `top-center` by default

## Common Scenarios

### Scenario 1: Form Submission
```typescript
const handleSubmit = async (data: FormData) => {
  const result = await updateProfile(data);
  
  if (result.success) {
    showSuccessToast('Profile updated successfully!');
  } else {
    showErrorToast(result.message || 'Failed to update profile');
  }
};
```

### Scenario 2: Delete Confirmation
```typescript
const handleDelete = async (id: string) => {
  if (confirm('Are you sure you want to delete this item?')) {
    const result = await deleteItem(id);
    
    if (result.success) {
      showSuccessToast('Item deleted successfully');
    } else {
      showErrorToast('Failed to delete item');
    }
  }
};
```

### Scenario 3: File Upload
```typescript
const handleUpload = async (file: File) => {
  const toastId = showLoadingToast('Uploading file...');
  
  try {
    const result = await uploadFile(file);
    dismissToast(toastId);
    
    if (result.success) {
      showSuccessToast('File uploaded successfully!');
    } else {
      showErrorToast('Upload failed. Please try again.');
    }
  } catch (error) {
    dismissToast(toastId);
    showErrorToast('Upload failed. Please check your connection.');
  }
};
```

### Scenario 4: Async Operation with Promise
```typescript
const handleDataFetch = () => {
  const fetchPromise = fetchData();
  
  showPromiseToast(fetchPromise, {
    loading: 'Loading data...',
    success: 'Data loaded successfully!',
    error: 'Failed to load data',
  });
};
```

## Testing Toast Notifications

To test toast notifications in your components:

1. Import the toast example component:
```typescript
import { ToastExamples } from '@/components/parent/common/toast-examples';
```

2. Add it to a test page to see all toast types in action

3. Verify that toasts appear correctly and dismiss after the appropriate duration

## Troubleshooting

### Toast not appearing
- Ensure `<Toaster />` is included in the layout (already in `src/app/parent/layout.tsx`)
- Check that you're importing from the correct path: `@/lib/utils/toast-utils`
- Verify the component is a client component (`'use client'` directive)

### Toast appearing multiple times
- Ensure you're not calling the toast function multiple times
- Check for duplicate event handlers
- Use `dismissToast()` to clear previous toasts if needed

### Toast styling issues
- All toast styles are pre-configured in `toast-utils.ts`
- Don't override styles unless necessary for consistency
- Use the custom toast functions for specific use cases

## Related Files

- Toast utilities: `src/lib/utils/toast-utils.ts`
- Toast examples: `src/components/parent/common/toast-examples.tsx`
- Parent layout (includes Toaster): `src/app/parent/layout.tsx`
- Validation schemas: `src/lib/schemaValidation/parent-*-schemas.ts`

