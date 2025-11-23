import { useEffect, useCallback } from 'react';

/**
 * Hook to persist form data to localStorage
 * Automatically saves form data and restores it on mount
 * Useful for preserving user input when errors occur
 */
export function useFormPersistence<T extends Record<string, any>>(
  formKey: string,
  formData: T,
  options: {
    enabled?: boolean;
    debounceMs?: number;
  } = {}
) {
  const { enabled = true, debounceMs = 500 } = options;

  // Save form data to localStorage
  const saveFormData = useCallback(
    (data: T) => {
      if (!enabled) return;

      try {
        const key = `form_${formKey}`;
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save form data:', error);
      }
    },
    [formKey, enabled]
  );

  // Load form data from localStorage
  const loadFormData = useCallback((): T | null => {
    if (!enabled) return null;

    try {
      const key = `form_${formKey}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved) as T;
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
    return null;
  }, [formKey, enabled]);

  // Clear saved form data
  const clearFormData = useCallback(() => {
    try {
      const key = `form_${formKey}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear form data:', error);
    }
  }, [formKey]);

  // Auto-save form data when it changes (with debounce)
  useEffect(() => {
    if (!enabled) return;

    const timeoutId = setTimeout(() => {
      saveFormData(formData);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [formData, saveFormData, debounceMs, enabled]);

  return {
    saveFormData,
    loadFormData,
    clearFormData,
  };
}

/**
 * Hook to restore form data on mount
 * Returns the saved data if available
 */
export function useFormRestore<T extends Record<string, any>>(
  formKey: string,
  defaultValues: T
): T {
  try {
    const key = `form_${formKey}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved) as T;
      // Merge with default values to ensure all fields exist
      return { ...defaultValues, ...parsed };
    }
  } catch (error) {
    console.error('Failed to restore form data:', error);
  }
  return defaultValues;
}
