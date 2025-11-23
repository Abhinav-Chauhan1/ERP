/**
 * Error Handling Examples
 * This file demonstrates how to use the error handling utilities
 */

import {
  ApplicationError,
  handleAsync,
  retryOperation,
  logError,
  type Result,
} from './error-handler';

// ============================================================================
// Example 1: Server Action with Error Handling
// ============================================================================

export async function createStudentAction(data: any): Promise<Result<any>> {
  return handleAsync(async () => {
    // Validate input
    if (!data.name || !data.email) {
      throw new ApplicationError(
        'validation',
        'Missing required fields',
        'Please provide both name and email.',
        false,
        400
      );
    }

    // Check permissions
    const hasPermission = await checkPermission('CREATE_STUDENT');
    if (!hasPermission) {
      throw new ApplicationError(
        'authorization',
        'User lacks CREATE_STUDENT permission',
        "You don't have permission to create students.",
        false,
        403
      );
    }

    // Perform database operation
    try {
      const student = await prisma.student.create({ data });
      return student;
    } catch (error: any) {
      // Handle database errors
      if (error.code === 'P2002') {
        throw new ApplicationError(
          'validation',
          'Duplicate email',
          'A student with this email already exists.',
          false,
          409
        );
      }
      throw error;
    }
  });
}

// Usage in component:
// const result = await createStudentAction(formData);
// if (!result.success) {
//   // Display error.error.userMessage to user
//   setError(result.error.userMessage);
// }

// ============================================================================
// Example 2: API Call with Retry
// ============================================================================

export async function fetchDataWithRetry() {
  try {
    const data = await retryOperation(
      async () => {
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw new ApplicationError(
            'network',
            `HTTP ${response.status}`,
            'Failed to fetch data. Please try again.',
            true,
            response.status
          );
        }
        return response.json();
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 5000,
      }
    );
    return data;
  } catch (error) {
    logError(error as Error, { context: 'fetchDataWithRetry' });
    throw error;
  }
}

// ============================================================================
// Example 3: Form Submission with Error Handling
// ============================================================================

export async function handleFormSubmit(formData: any) {
  const result = await handleAsync(async () => {
    // Simulate API call
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new ApplicationError(
          'authentication',
          'Unauthorized',
          'Your session has expired. Please log in again.',
          false,
          401
        );
      }
      if (response.status === 422) {
        throw new ApplicationError(
          'validation',
          'Validation failed',
          'Please check your input and try again.',
          false,
          422
        );
      }
      throw new ApplicationError(
        'server',
        `HTTP ${response.status}`,
        'An error occurred while processing your request.',
        true,
        response.status
      );
    }

    return response.json();
  });

  return result;
}

// ============================================================================
// Example 4: Component Usage with ErrorDisplay
// ============================================================================

/*
'use client';

import { useState } from 'react';
import { ErrorDisplay } from '@/components/shared/error-display';
import { handleAsync } from '@/lib/utils/error-handler';

export function MyComponent() {
  const [error, setError] = useState<unknown>(null);
  const [data, setData] = useState(null);

  const loadData = async () => {
    setError(null);
    const result = await handleAsync(async () => {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    });

    if (result.success) {
      setData(result.data);
    } else {
      setError(result.error);
    }
  };

  return (
    <div>
      {error && (
        <ErrorDisplay
          error={error}
          onRetry={loadData}
        />
      )}
      {data && <div>{JSON.stringify(data)}</div>}
    </div>
  );
}
*/

// ============================================================================
// Example 5: Form with Persistence
// ============================================================================

/*
'use client';

import { useState } from 'react';
import { ErrorSafeForm } from '@/components/shared/error-safe-form';
import { useFormRestore } from '@/hooks/use-form-persistence';

export function StudentForm() {
  const defaultValues = { name: '', email: '', class: '' };
  const initialData = useFormRestore('student-form', defaultValues);
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = async (data: typeof formData) => {
    const response = await fetch('/api/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create student');
    return response.json();
  };

  return (
    <ErrorSafeForm
      formKey="student-form"
      formData={formData}
      onSubmit={handleSubmit}
      persistData={true}
    >
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <button type="submit">Submit</button>
    </ErrorSafeForm>
  );
}
*/

// Dummy functions for examples
async function checkPermission(permission: string): Promise<boolean> {
  return true;
}

const prisma = {
  student: {
    create: async (options: any) => ({ id: '1', ...options.data }),
  },
};
