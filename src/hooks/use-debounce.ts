/**
 * React Hooks for Debouncing and Throttling
 * Provides React-specific hooks for optimizing user input and API calls
 */

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { debounce, throttle, DEBOUNCE_PRESETS, THROTTLE_PRESETS } from "@/lib/utils/debounce";

/**
 * Hook to debounce a value
 * Use for: search inputs, form fields
 * 
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 * 
 * useEffect(() => {
 *   // This will only run 300ms after user stops typing
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = DEBOUNCE_PRESETS.SEARCH): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Hook to debounce a callback function
 * Use for: event handlers, API calls
 * 
 * @example
 * const handleSearch = useDebouncedCallback(
 *   (query: string) => {
 *     fetchResults(query);
 *   },
 *   300
 * );
 * 
 * <input onChange={(e) => handleSearch(e.target.value)} />
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = DEBOUNCE_PRESETS.SEARCH
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  
  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Memoize debounced function
  const debouncedCallback = useMemo(
    () =>
      debounce((...args: Parameters<T>) => {
        callbackRef.current(...args);
      }, delay),
    [delay]
  );
  
  return debouncedCallback;
}

/**
 * Hook to throttle a callback function
 * Use for: scroll handlers, mouse move handlers
 * 
 * @example
 * const handleScroll = useThrottledCallback(
 *   () => {
 *     console.log('Scrolled');
 *   },
 *   100
 * );
 * 
 * useEffect(() => {
 *   window.addEventListener('scroll', handleScroll);
 *   return () => window.removeEventListener('scroll', handleScroll);
 * }, [handleScroll]);
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = THROTTLE_PRESETS.SCROLL
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  
  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Memoize throttled function
  const throttledCallback = useMemo(
    () =>
      throttle((...args: Parameters<T>) => {
        callbackRef.current(...args);
      }, delay),
    [delay]
  );
  
  return throttledCallback;
}

/**
 * Hook for debounced search with loading state
 * Use for: search inputs with API calls
 * 
 * @example
 * const { results, loading, search } = useDebouncedSearch(
 *   async (query) => {
 *     const res = await fetch(`/api/search?q=${query}`);
 *     return res.json();
 *   },
 *   { delay: 300, minLength: 2 }
 * );
 * 
 * <input onChange={(e) => search(e.target.value)} />
 * {loading && <Spinner />}
 * {results.map(result => <div key={result.id}>{result.name}</div>)}
 */
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T>,
  options?: {
    delay?: number;
    minLength?: number;
    initialQuery?: string;
  }
) {
  const { delay = DEBOUNCE_PRESETS.SEARCH, minLength = 2, initialQuery = "" } = options || {};
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const debouncedQuery = useDebounce(query, delay);
  
  useEffect(() => {
    if (debouncedQuery.length < minLength) {
      setResults(null);
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    
    const performSearch = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await searchFn(debouncedQuery);
        if (!cancelled) {
          setResults(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Search failed"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    performSearch();
    
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, minLength, searchFn]);
  
  return {
    query,
    results,
    loading,
    error,
    search: setQuery,
    clear: () => {
      setQuery("");
      setResults(null);
      setError(null);
    },
  };
}

/**
 * Hook for debounced form validation
 * Use for: form fields that need async validation
 * 
 * @example
 * const { value, error, loading, setValue } = useDebouncedValidation(
 *   async (val) => {
 *     const res = await fetch(`/api/validate?email=${val}`);
 *     if (!res.ok) throw new Error('Email already exists');
 *   },
 *   { delay: 500 }
 * );
 * 
 * <input value={value} onChange={(e) => setValue(e.target.value)} />
 * {loading && <Spinner />}
 * {error && <Error>{error.message}</Error>}
 */
export function useDebouncedValidation(
  validateFn: (value: string) => Promise<void>,
  options?: {
    delay?: number;
    minLength?: number;
  }
) {
  const { delay = DEBOUNCE_PRESETS.VALIDATION, minLength = 1 } = options || {};
  
  const [value, setValue] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  
  const debouncedValue = useDebounce(value, delay);
  
  useEffect(() => {
    if (debouncedValue.length < minLength) {
      setError(null);
      setLoading(false);
      setIsValid(false);
      return;
    }
    
    let cancelled = false;
    
    const validate = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await validateFn(debouncedValue);
        if (!cancelled) {
          setIsValid(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Validation failed"));
          setIsValid(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    validate();
    
    return () => {
      cancelled = true;
    };
  }, [debouncedValue, minLength, validateFn]);
  
  return {
    value,
    error,
    loading,
    isValid,
    setValue,
    reset: () => {
      setValue("");
      setError(null);
      setIsValid(false);
    },
  };
}

/**
 * Hook for auto-save functionality
 * Use for: forms that auto-save
 * 
 * @example
 * const { save, saving, lastSaved } = useAutoSave(
 *   async (data) => {
 *     await fetch('/api/save', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     });
 *   },
 *   { delay: 1000 }
 * );
 * 
 * <input onChange={(e) => save({ content: e.target.value })} />
 * {saving && <span>Saving...</span>}
 * {lastSaved && <span>Last saved: {lastSaved.toLocaleTimeString()}</span>}
 */
export function useAutoSave<T>(
  saveFn: (data: T) => Promise<void>,
  options?: {
    delay?: number;
  }
) {
  const { delay = DEBOUNCE_PRESETS.AUTOSAVE } = options || {};
  
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const debouncedSave = useDebouncedCallback(
    async (data: T) => {
      setSaving(true);
      setError(null);
      
      try {
        await saveFn(data);
        setLastSaved(new Date());
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Save failed"));
      } finally {
        setSaving(false);
      }
    },
    delay
  );
  
  return {
    save: debouncedSave,
    saving,
    lastSaved,
    error,
  };
}

/**
 * Hook for window resize with debouncing
 * Use for: responsive layouts that need to react to window size
 * 
 * @example
 * const windowSize = useWindowSize(150);
 * 
 * return (
 *   <div>
 *     Window size: {windowSize.width} x {windowSize.height}
 *   </div>
 * );
 */
export function useWindowSize(delay: number = DEBOUNCE_PRESETS.RESIZE) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });
  
  const handleResize = useDebouncedCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, delay);
  
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);
  
  return windowSize;
}

/**
 * Hook for scroll position with throttling
 * Use for: scroll-based animations, infinite scroll
 * 
 * @example
 * const scrollY = useScrollPosition(100);
 * 
 * return (
 *   <div className={scrollY > 100 ? 'scrolled' : ''}>
 *     Content
 *   </div>
 * );
 */
export function useScrollPosition(delay: number = THROTTLE_PRESETS.SCROLL) {
  const [scrollY, setScrollY] = useState(
    typeof window !== "undefined" ? window.scrollY : 0
  );
  
  const handleScroll = useThrottledCallback(() => {
    setScrollY(window.scrollY);
  }, delay);
  
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);
  
  return scrollY;
}
