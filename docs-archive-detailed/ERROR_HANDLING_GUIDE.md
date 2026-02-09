# Error Handling Guide

This guide explains the comprehensive error handling system implemented in the ERP application.

## Overview

The error handling system provides:
- **User-friendly error messages** with suggested actions
- **Automatic retry functionality** for network errors
- **Form data preservation** on submission errors
- **Custom error pages** (404, 500, and section-specific)
- **Consistent error logging** for monitoring
- **Type-safe error handling** with TypeScript

## Components

### 1. Error Handler Utilities (`src/lib/utils/error-handler.ts`)

Core utilities for error handling across the application.

#### Key Functions

**`parseError(error: unknown): AppError`**
- Converts any error into a structured `AppError` object
- Automatically categorizes errors (network, validation, authentication, etc.)
- Provides user-friendly messages

**`handleAsync<T>(operation: () => Promise<T>): Promise<Result<T>>`**
- Wraps async operations with error handling
- Returns a `Result` type for type-safe error handling
- Automatically logs errors

**`retryOperation<T>(operation: () => Promise<T>, options): Promise<T>`**
- Retries failed operations with exponential backoff
- Only retries retryable errors (network, timeout)
- Configurable retry count and delays

**`logError(error: Error, context?: Record<string, any>)`**
- Logs errors with full context
- Ready for integration with monitoring services (Sentry, etc.)

#### Error Types

```typescript
type ErrorType = 
  | 'network'        // Connection issues
  | 'validation'     // Input validation failures
  | 'authentication' // Login/session issues
  | 'authorization'  // Permission denied
  | 'not_found'      // Resource not found
  | 'server'         // Server errors
  | 'unknown';       // Unexpected errors
```

#### Usage Example

```typescript
import { handleAsync, ApplicationError } from '@/lib/utils/error-handler';

export async function createStudent(data: StudentInput) {
  return handleAsync(async () => {
    // Validate
    if (!data.email) {
      throw new ApplicationError(
        'validation',
        'Missing email',
        'Please provide an email address.',
        false,
        400
      );
    }

    // Perform operation
    const student = await prisma.student.create({ data });
    return student;
  });
}

// In component:
const result = await createStudent(formData);
if (!result.success) {
  setError(result.error.userMessage);
}
```

### 2. Error Display Components

#### `ErrorDisplay` (`src/components/shared/error-display.tsx`)

Full-featured error display with icons, messages, and retry buttons.

```tsx
import { ErrorDisplay } from '@/components/shared/error-display';

<ErrorDisplay
  error={error}
  onRetry={handleRetry}
  showDetails={process.env.NODE_ENV === 'development'}
/>
```

#### `InlineErrorDisplay`

Compact error display for smaller contexts.

```tsx
import { InlineErrorDisplay } from '@/components/shared/error-display';

<InlineErrorDisplay error={error} onRetry={handleRetry} />
```

#### `FullPageError`

Full-page error display for critical errors.

```tsx
import { FullPageError } from '@/components/shared/error-display';

<FullPageError
  error={error}
  onRetry={handleRetry}
  onGoHome={() => router.push('/')}
/>
```

### 3. Error Boundary (`src/components/shared/error-boundary.tsx`)

React Error Boundary for catching component errors.

```tsx
import { ErrorBoundary } from '@/components/shared/error-boundary';

<ErrorBoundary
  fallback={(error, reset) => (
    <CustomErrorUI error={error} onReset={reset} />
  )}
  onError={(error, errorInfo) => {
    // Custom error handling
    logToService(error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### 4. Form Persistence

#### `useFormPersistence` Hook

Automatically saves form data to localStorage.

```tsx
import { useFormPersistence } from '@/hooks/use-form-persistence';

const { saveFormData, loadFormData, clearFormData } = useFormPersistence(
  'my-form',
  formData,
  { debounceMs: 500 }
);
```

#### `useFormRestore` Hook

Restores form data on mount.

```tsx
import { useFormRestore } from '@/hooks/use-form-persistence';

const defaultValues = { name: '', email: '' };
const initialData = useFormRestore('my-form', defaultValues);
const [formData, setFormData] = useState(initialData);
```

#### `ErrorSafeForm` Component

Form wrapper that preserves data on errors.

```tsx
import { ErrorSafeForm } from '@/components/shared/error-safe-form';

<ErrorSafeForm
  formKey="student-form"
  formData={formData}
  onSubmit={handleSubmit}
  persistData={true}
>
  {/* Form fields */}
</ErrorSafeForm>
```

### 5. Error Pages

#### Global 404 Page (`src/app/not-found.tsx`)

Displayed when a route doesn't exist.

#### Global Error Page (`src/app/error.tsx`)

Catches errors at the root level.

#### Section-Specific Error Pages

- `src/app/admin/error.tsx`
- `src/app/student/error.tsx`
- `src/app/teacher/error.tsx`
- `src/app/parent/error.tsx`

All error pages include:
- User-friendly error messages
- Retry buttons
- Navigation options
- Error IDs for support
- Technical details (development only)

## Best Practices

### 1. Server Actions

Always use `handleAsync` for server actions:

```typescript
export async function myAction(data: any) {
  return handleAsync(async () => {
    // Your logic here
  });
}
```

### 2. API Calls

Use `retryOperation` for network requests:

```typescript
const data = await retryOperation(
  async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed');
    return response.json();
  },
  { maxRetries: 3 }
);
```

### 3. Form Submissions

Use `ErrorSafeForm` to preserve data:

```tsx
<ErrorSafeForm
  formKey="unique-form-id"
  formData={formData}
  onSubmit={handleSubmit}
>
  {/* Form fields */}
</ErrorSafeForm>
```

### 4. Component Error Handling

Wrap components with `ErrorBoundary`:

```tsx
<ErrorBoundary>
  <ComplexComponent />
</ErrorBoundary>
```

### 5. Custom Error Messages

Throw `ApplicationError` for specific scenarios:

```typescript
throw new ApplicationError(
  'validation',
  'Technical message for logs',
  'User-friendly message',
  false, // retryable
  400    // status code
);
```

## Error Message Guidelines

### User-Friendly Messages

- **Be specific**: "Unable to save student. Please check the email address."
- **Provide action**: "Please try again" or "Please contact support"
- **Avoid technical jargon**: Use plain language
- **Be empathetic**: "We're sorry for the inconvenience"

### Technical Messages

- **Include context**: "Failed to create student: duplicate email"
- **Include error codes**: "Database error P2002"
- **Include stack traces**: For debugging purposes
- **Include request IDs**: For tracing in logs

## Integration with Monitoring

The error handling system is ready for integration with monitoring services like Sentry:

```typescript
// In error-handler.ts
if (typeof window !== 'undefined' && window.Sentry) {
  window.Sentry.captureException(error, {
    extra: errorContext,
  });
}
```

To enable:
1. Install Sentry SDK
2. Configure Sentry in your app
3. Uncomment the Sentry code in error handlers

## Testing Error Handling

### Test Error Scenarios

```typescript
// Test validation errors
it('should handle validation errors', async () => {
  const result = await createStudent({ email: '' });
  expect(result.success).toBe(false);
  expect(result.error.type).toBe('validation');
});

// Test network errors
it('should retry on network errors', async () => {
  const mockFetch = jest.fn()
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce({ ok: true, json: () => ({}) });
  
  await retryOperation(() => mockFetch());
  expect(mockFetch).toHaveBeenCalledTimes(2);
});
```

## Troubleshooting

### Form Data Not Persisting

- Check that `formKey` is unique
- Verify localStorage is available
- Check browser console for errors

### Retry Not Working

- Verify error is marked as `retryable`
- Check network connectivity
- Verify retry options are configured

### Error Messages Not Displaying

- Check that error is being caught
- Verify `ErrorDisplay` component is rendered
- Check browser console for errors

## Future Enhancements

- [ ] Integration with Sentry or similar monitoring service
- [ ] Offline error queue for failed requests
- [ ] Error analytics dashboard
- [ ] Automated error categorization with ML
- [ ] User feedback on error messages

## Related Documentation

- [Security Guide](./SECURITY.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Testing Guide](./TESTING_GUIDE.md)
