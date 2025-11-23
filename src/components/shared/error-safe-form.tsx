'use client';

import { ReactNode, FormEvent, useState } from 'react';
import { useFormPersistence } from '@/hooks/use-form-persistence';
import { ErrorDisplay } from './error-display';
import { parseError } from '@/lib/utils/error-handler';

interface ErrorSafeFormProps<T extends Record<string, any>> {
  formKey: string;
  formData: T;
  onSubmit: (data: T) => Promise<void>;
  children: ReactNode;
  className?: string;
  persistData?: boolean;
  showErrorDetails?: boolean;
}

/**
 * Error-Safe Form Component
 * Automatically preserves form data when errors occur
 * Displays user-friendly error messages with retry functionality
 */
export function ErrorSafeForm<T extends Record<string, any>>({
  formKey,
  formData,
  onSubmit,
  children,
  className = '',
  persistData = true,
  showErrorDetails = false,
}: ErrorSafeFormProps<T>): JSX.Element {
  const [error, setError] = useState<unknown>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Persist form data to localStorage
  const { clearFormData } = useFormPersistence(formKey, formData, {
    enabled: persistData,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      // Clear saved form data on successful submission
      if (persistData) {
        clearFormData();
      }
    } catch (err) {
      // Set error to display to user
      setError(err);
      // Form data is automatically preserved by useFormPersistence hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    // Create a synthetic form event
    const syntheticEvent = {
      preventDefault: () => {},
    } as FormEvent;
    handleSubmit(syntheticEvent);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {error ? (
        <div className="mb-4">
          <ErrorDisplay
            error={error}
            onRetry={parseError(error).retryable ? handleRetry : undefined}
            showDetails={showErrorDetails}
          />
        </div>
      ) : null}
      {children}
    </form>
  );
}
