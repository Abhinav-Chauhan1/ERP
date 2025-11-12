/**
 * React hook for CSRF token management
 * Provides CSRF token for form submissions
 */

"use client";

import { useEffect, useState } from "react";

/**
 * Hook to get CSRF token for forms
 * Token should be passed from server component as prop
 */
export function useCsrfToken(initialToken?: string) {
  const [token, setToken] = useState<string | null>(initialToken || null);
  
  return token;
}

/**
 * Hook to fetch CSRF token from API endpoint
 * Use this when you need to get a fresh token client-side
 */
export function useFetchCsrfToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await fetch("/api/csrf-token");
        if (!response.ok) {
          throw new Error("Failed to fetch CSRF token");
        }
        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    
    fetchToken();
  }, []);
  
  return { token, loading, error };
}
