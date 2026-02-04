import { useState, useEffect } from 'react';

/**
 * Hook to manage CSRF tokens for client-side requests
 */
export function useCSRFToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get token from meta tag (set by server)
  const getTokenFromMeta = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag?.getAttribute('content') || null;
  };

  // Fetch token from API
  const fetchToken = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data = await response.json();
      return data.token || null;
    } catch (err) {
      console.error('Error fetching CSRF token:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch CSRF token');
      return null;
    }
  };

  // Initialize token
  useEffect(() => {
    const initializeToken = async () => {
      setLoading(true);
      setError(null);

      // Try to get token from meta tag first
      let csrfToken = getTokenFromMeta();

      // If not available, fetch from API
      if (!csrfToken) {
        csrfToken = await fetchToken();
      }

      setToken(csrfToken);
      setLoading(false);
    };

    initializeToken();
  }, []);

  // Refresh token function
  const refreshToken = async (): Promise<string | null> => {
    setLoading(true);
    setError(null);

    const newToken = await fetchToken();
    setToken(newToken);
    setLoading(false);

    return newToken;
  };

  // Enhanced fetch function with automatic CSRF token inclusion
  const csrfFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const currentToken = token || getTokenFromMeta();
    
    if (!currentToken) {
      throw new Error('CSRF token not available');
    }

    const headers = new Headers(options.headers);
    
    // Add CSRF token for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET')) {
      headers.set('x-csrf-token', currentToken);
    }

    // Ensure credentials are included for cookie-based auth
    const fetchOptions: RequestInit = {
      ...options,
      headers,
      credentials: options.credentials || 'same-origin',
    };

    try {
      const response = await fetch(url, fetchOptions);
      
      // If we get a 403 with CSRF error, try to refresh token and retry once
      if (response.status === 403) {
        const errorData = await response.clone().json().catch(() => ({}));
        if (errorData.code === 'CSRF_TOKEN_INVALID') {
          console.warn('CSRF token invalid, refreshing...');
          const newToken = await refreshToken();
          
          if (newToken) {
            headers.set('x-csrf-token', newToken);
            return fetch(url, { ...fetchOptions, headers });
          }
        }
      }

      return response;
    } catch (err) {
      console.error('CSRF fetch error:', err);
      throw err;
    }
  };

  return {
    token,
    loading,
    error,
    refreshToken,
    csrfFetch,
  };
}

/**
 * Simple function to get CSRF token synchronously (for forms)
 */
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  return metaTag?.getAttribute('content') || null;
}

/**
 * Add CSRF token to FormData
 */
export function addCSRFToFormData(formData: FormData): FormData {
  const token = getCSRFToken();
  if (token) {
    formData.append('_csrf', token);
  }
  return formData;
}

/**
 * Create headers with CSRF token
 */
export function createCSRFHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getCSRFToken();
  const headers: Record<string, string> = { ...additionalHeaders };
  
  if (token) {
    headers['x-csrf-token'] = token;
  }
  
  return headers;
}