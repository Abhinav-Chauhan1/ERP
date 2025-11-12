import toast from 'react-hot-toast';

/**
 * Toast utility functions for consistent toast notifications across the application
 */

export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-center',
    style: {
      background: '#10b981',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10b981',
    },
  });
};

export const showErrorToast = (message: string) => {
  toast.error(message, {
    duration: 5000,
    position: 'top-center',
    style: {
      background: '#ef4444',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ef4444',
    },
  });
};

export const showInfoToast = (message: string) => {
  toast(message, {
    duration: 4000,
    position: 'top-center',
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

export const showWarningToast = (message: string) => {
  toast(message, {
    duration: 4000,
    position: 'top-center',
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

export const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    position: 'top-center',
    style: {
      background: '#6b7280',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

export const showPromiseToast = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      position: 'top-center',
      style: {
        padding: '16px',
        borderRadius: '8px',
      },
      success: {
        duration: 4000,
        style: {
          background: '#10b981',
          color: '#fff',
        },
      },
      error: {
        duration: 5000,
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      },
    }
  );
};

/**
 * Custom toast for payment operations
 */
export const showPaymentSuccessToast = (amount: number, receiptNumber: string) => {
  toast.success(
    `Payment of ₹${amount.toFixed(2)} successful! Receipt: ${receiptNumber}`,
    {
      duration: 6000,
      position: 'top-center',
      style: {
        background: '#10b981',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
    }
  );
};

/**
 * Custom toast for form validation errors
 */
export const showValidationErrorToast = (errors: string[]) => {
  const errorMessage = errors.length === 1 
    ? errors[0] 
    : `Please fix the following errors:\n${errors.join('\n')}`;
  
  toast.error(errorMessage, {
    duration: 5000,
    position: 'top-center',
    style: {
      background: '#ef4444',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      whiteSpace: 'pre-line',
    },
  });
};

/**
 * Custom toast for meeting confirmations
 */
export const showMeetingConfirmationToast = (teacherName: string, date: string) => {
  toast.success(
    `Meeting with ${teacherName} scheduled for ${date}`,
    {
      duration: 5000,
      position: 'top-center',
      style: {
        background: '#10b981',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
    }
  );
};

/**
 * Custom toast for event registration
 */
export const showEventRegistrationToast = (eventName: string) => {
  toast.success(
    `Successfully registered for ${eventName}`,
    {
      duration: 5000,
      position: 'top-center',
      style: {
        background: '#10b981',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
    }
  );
};

