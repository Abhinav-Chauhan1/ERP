/**
 * Toast Hook
 * 
 * Wrapper around react-hot-toast for consistent toast notifications
 */

import toast from 'react-hot-toast';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

const showToast = ({ title, description, variant = 'default', duration = 3000 }: ToastOptions) => {
  const message = description || title || '';

  switch (variant) {
    case 'success':
      return toast.success(message, { duration });
    case 'destructive':
      return toast.error(message, { duration });
    default:
      return toast(message, { duration });
  }
};

export function useToast() {
  return {
    toast: showToast,
  };
}

// Export individual toast functions for convenience
export const toastSuccess = (message: string, duration = 3000) => {
  return toast.success(message, { duration });
};

export const toastError = (message: string, duration = 3000) => {
  return toast.error(message, { duration });
};

export const toastInfo = (message: string, duration = 3000) => {
  return toast(message, { duration });
};

export const toastLoading = (message: string) => {
  return toast.loading(message);
};

export const toastDismiss = (toastId: string) => {
  return toast.dismiss(toastId);
};
