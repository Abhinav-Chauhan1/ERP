# Error Handling Quick Reference

## Quick Start

### 1. Server Action with Error Handling

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
        false
      );
    }
    
    // Perform operation
    return await prisma.student.create({ data });
  });
}
```

### 2. Display Error in Component

```tsx
import { ErrorDisplay } from '@/components/shared/error-display';

const [error, setError] = useState(null);

const handleSubmit = async () => {
  const result = await createStudent(formData);
  if (!result.success) {
    setError(result.error);
  }
};

return (
  <>
    {error && <ErrorDisplay error={error} onRetry={handleSubmit} />}
    {/* Your form */}
  </>
);
```

### 3. Form with Data Persistence

```tsx
import { ErrorSafeForm } from '@/components/shared/error-safe-form';
import { useFormRestore } from '@/hooks/use-form-persistence';

const defaultValues = { name: '', email: '' };
const initialData = useFormRestore('student-form', defaultValues);
const [formData, setFormData] = useState(initialData);

return (
  <ErrorSafeForm
    formKey="student-form"
    formData={formData}
    onSubmit={handleSubmit}
  >
    <input
      value={formData.name}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    />
    <button type="submit">Submit</button>
  </ErrorSafeForm>
);
```

### 4. API Call with Retry

```typescript
import { retryOperation } from '@/lib/utils/error-handler';

const data = await retryOperation(
  async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },
  { maxRetries: 3, initialDelay: 1000 }
);
```

### 5. Wrap Component with Error Boundary

```tsx
import { ErrorBoundary } from '@/components/shared/error-boundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Error Types

| Type | Description | Retryable | Example |
|------|-------------|-----------|---------|
| `network` | Connection issues | ✅ Yes | "Unable to connect to server" |
| `validation` | Invalid input | ❌ No | "Email is required" |
| `authentication` | Login required | ❌ No | "Please log in" |
| `authorization` | Permission denied | ❌ No | "Access denied" |
| `not_found` | Resource missing | ❌ No | "Student not found" |
| `server` | Server error | ⚠️ Maybe | "Internal server error" |
| `unknown` | Unexpected error | ❌ No | "An error occurred" |

## Components

### ErrorDisplay

```tsx
<ErrorDisplay
  error={error}              // Error object
  onRetry={handleRetry}      // Optional retry function
  retryLabel="Try Again"     // Optional retry button text
  showDetails={false}        // Show technical details
  className=""               // Additional CSS classes
/>
```

### InlineErrorDisplay

```tsx
<InlineErrorDisplay
  error={error}
  onRetry={handleRetry}
/>
```

### FullPageError

```tsx
<FullPageError
  error={error}
  onRetry={handleRetry}
  onGoHome={() => router.push('/')}
/>
```

### ErrorBoundary

```tsx
<ErrorBoundary
  fallback={(error, reset) => <CustomUI />}  // Optional custom UI
  onError={(error, info) => log(error)}      // Optional error handler
>
  <YourComponent />
</ErrorBoundary>
```

### ErrorSafeForm

```tsx
<ErrorSafeForm
  formKey="unique-id"        // Unique form identifier
  formData={formData}        // Current form data
  onSubmit={handleSubmit}    // Submit handler
  persistData={true}         // Enable persistence
  showErrorDetails={false}   // Show technical details
>
  {/* Form fields */}
</ErrorSafeForm>
```

## Hooks

### useFormPersistence

```tsx
const { saveFormData, loadFormData, clearFormData } = useFormPersistence(
  'form-key',
  formData,
  { enabled: true, debounceMs: 500 }
);
```

### useFormRestore

```tsx
const initialData = useFormRestore('form-key', defaultValues);
```

## Utility Functions

### handleAsync

```typescript
const result = await handleAsync(async () => {
  // Your async operation
});

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

### retryOperation

```typescript
await retryOperation(
  async () => { /* operation */ },
  {
    maxRetries: 3,           // Max retry attempts
    initialDelay: 1000,      // Initial delay (ms)
    maxDelay: 10000,         // Max delay (ms)
    backoffMultiplier: 2,    // Delay multiplier
  }
);
```

### parseError

```typescript
const appError = parseError(error);
console.log(appError.type);         // Error type
console.log(appError.userMessage);  // User-friendly message
console.log(appError.retryable);    // Can retry?
```

### logError

```typescript
logError(error, {
  context: 'user-action',
  userId: '123',
  additionalData: {}
});
```

### getUserFriendlyMessage

```typescript
const message = getUserFriendlyMessage(error);
```

### isRetryable

```typescript
if (isRetryable(error)) {
  // Show retry button
}
```

## ApplicationError Constructor

```typescript
throw new ApplicationError(
  'validation',                    // Error type
  'Technical message for logs',    // Technical message
  'User-friendly message',         // User message
  false,                           // Retryable?
  400                              // HTTP status code (optional)
);
```

## Common Patterns

### Pattern 1: Server Action

```typescript
export async function myAction(data: any) {
  return handleAsync(async () => {
    // Validate
    if (!data.field) {
      throw new ApplicationError('validation', 'Missing field', 'Please provide field', false);
    }
    
    // Check permissions
    if (!hasPermission()) {
      throw new ApplicationError('authorization', 'No permission', 'Access denied', false, 403);
    }
    
    // Perform operation
    return await db.operation(data);
  });
}
```

### Pattern 2: Component with Error Handling

```tsx
function MyComponent() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setError(null);
    setLoading(true);
    
    const result = await handleAsync(async () => {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed');
      return response.json();
    });

    setLoading(false);
    
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <>
      {error && <ErrorDisplay error={error} onRetry={loadData} />}
      {loading && <Spinner />}
      {/* Content */}
    </>
  );
}
```

### Pattern 3: Form with Persistence

```tsx
function MyForm() {
  const defaultValues = { name: '', email: '' };
  const initialData = useFormRestore('my-form', defaultValues);
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = async (data: typeof formData) => {
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed');
  };

  return (
    <ErrorSafeForm
      formKey="my-form"
      formData={formData}
      onSubmit={handleSubmit}
    >
      {/* Form fields */}
    </ErrorSafeForm>
  );
}
```

## Checklist

- [ ] Use `handleAsync` for all server actions
- [ ] Use `ErrorDisplay` to show errors to users
- [ ] Use `ErrorSafeForm` for important forms
- [ ] Wrap complex components with `ErrorBoundary`
- [ ] Throw `ApplicationError` for specific error types
- [ ] Use `retryOperation` for network requests
- [ ] Log errors with `logError` for monitoring
- [ ] Provide user-friendly error messages
- [ ] Test error scenarios
- [ ] Document error handling in your code
