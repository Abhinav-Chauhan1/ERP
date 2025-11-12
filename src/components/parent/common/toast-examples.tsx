'use client';

/**
 * Toast Notification Examples Component
 * 
 * This component demonstrates all toast notification types available in the parent dashboard.
 * Use this as a reference for implementing toast notifications in your components.
 * 
 * Requirements: 9.4 - Toast notifications for user feedback
 */

import { Button } from '@/components/ui/button';
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast,
  showLoadingToast,
  dismissToast,
  showPromiseToast,
  showPaymentSuccessToast,
  showValidationErrorToast,
  showMeetingConfirmationToast,
  showEventRegistrationToast,
} from '@/lib/utils/toast-utils';

export function ToastExamples() {
  // Example: Success toast for successful operations
  const handleSuccess = () => {
    showSuccessToast('Operation completed successfully!');
  };

  // Example: Error toast for failed operations
  const handleError = () => {
    showErrorToast('Something went wrong. Please try again.');
  };

  // Example: Info toast for informational messages
  const handleInfo = () => {
    showInfoToast('Your session will expire in 5 minutes.');
  };

  // Example: Warning toast for warnings
  const handleWarning = () => {
    showWarningToast('Please save your changes before leaving.');
  };

  // Example: Loading toast with manual dismiss
  const handleLoading = () => {
    const toastId = showLoadingToast('Processing your request...');
    
    // Simulate async operation
    setTimeout(() => {
      dismissToast(toastId);
      showSuccessToast('Request processed!');
    }, 3000);
  };

  // Example: Promise toast for async operations
  const handlePromise = () => {
    const mockAsyncOperation = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve('Success!') : reject('Failed!');
      }, 2000);
    });

    showPromiseToast(mockAsyncOperation, {
      loading: 'Processing...',
      success: 'Operation completed successfully!',
      error: 'Operation failed. Please try again.',
    });
  };

  // Example: Payment success toast
  const handlePaymentSuccess = () => {
    showPaymentSuccessToast(5000, 'RCP-2024-001234');
  };

  // Example: Validation error toast
  const handleValidationError = () => {
    showValidationErrorToast([
      'Email is required',
      'Password must be at least 8 characters',
      'Phone number is invalid',
    ]);
  };

  // Example: Meeting confirmation toast
  const handleMeetingConfirmation = () => {
    showMeetingConfirmationToast('Mr. John Smith', 'March 15, 2024 at 10:00 AM');
  };

  // Example: Event registration toast
  const handleEventRegistration = () => {
    showEventRegistrationToast('Annual Sports Day 2024');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Toast Notification Examples</h2>
        <p className="text-gray-600 mb-6">
          Click the buttons below to see different toast notification types
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h3 className="font-medium">Basic Toasts</h3>
          <div className="space-y-2">
            <Button onClick={handleSuccess} className="w-full" variant="default">
              Success Toast
            </Button>
            <Button onClick={handleError} className="w-full" variant="destructive">
              Error Toast
            </Button>
            <Button onClick={handleInfo} className="w-full" variant="secondary">
              Info Toast
            </Button>
            <Button onClick={handleWarning} className="w-full" variant="outline">
              Warning Toast
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Advanced Toasts</h3>
          <div className="space-y-2">
            <Button onClick={handleLoading} className="w-full" variant="secondary">
              Loading Toast
            </Button>
            <Button onClick={handlePromise} className="w-full" variant="secondary">
              Promise Toast
            </Button>
            <Button onClick={handleValidationError} className="w-full" variant="destructive">
              Validation Error
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Custom Toasts</h3>
          <div className="space-y-2">
            <Button onClick={handlePaymentSuccess} className="w-full" variant="default">
              Payment Success
            </Button>
            <Button onClick={handleMeetingConfirmation} className="w-full" variant="default">
              Meeting Confirmation
            </Button>
            <Button onClick={handleEventRegistration} className="w-full" variant="default">
              Event Registration
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Usage Examples</h3>
        <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
{`// Import the toast utilities
import { showSuccessToast, showErrorToast } from '@/lib/utils/toast-utils';

// In your component or action
const handleSubmit = async () => {
  try {
    const result = await someAction();
    if (result.success) {
      showSuccessToast('Data saved successfully!');
    } else {
      showErrorToast(result.message || 'Operation failed');
    }
  } catch (error) {
    showErrorToast('An unexpected error occurred');
  }
};`}
        </pre>
      </div>
    </div>
  );
}
