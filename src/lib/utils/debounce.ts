/**
 * Debouncing and Throttling Utilities
 * Provides helpers for optimizing rapid API calls and user input handling
 */

/**
 * Debounce function - delays execution until after wait time has elapsed since last call
 * Use for: search inputs, form validation, window resize
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Debounce with promise support - returns a promise that resolves with the result
 * Use for: async operations that need to be debounced
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeout: NodeJS.Timeout | null = null;
  let resolvePromise: ((value: Awaited<ReturnType<T>>) => void) | null = null;
  let rejectPromise: ((reason?: any) => void) | null = null;
  
  return function executedFunction(...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
    return new Promise((resolve, reject) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      resolvePromise = resolve;
      rejectPromise = reject;
      
      timeout = setTimeout(async () => {
        timeout = null;
        try {
          const result = await func(...args);
          if (resolvePromise) {
            resolvePromise(result);
          }
        } catch (error) {
          if (rejectPromise) {
            rejectPromise(error);
          }
        }
      }, wait);
    });
  };
}

/**
 * Throttle function - ensures function is called at most once per wait period
 * Use for: scroll events, mouse move, API rate limiting
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastArgs: Parameters<T> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          executedFunction(...lastArgs);
          lastArgs = null;
        }
      }, wait);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * Leading edge debounce - executes immediately on first call, then debounces
 * Use for: button clicks that should execute immediately but prevent rapid clicks
 */
export function debounceLeading<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const callNow = !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      timeout = null;
    }, wait);
    
    if (callNow) {
      func(...args);
    }
  };
}

/**
 * Request queue manager - prevents duplicate requests
 * Use for: preventing duplicate API calls
 */
class RequestQueue {
  private pending: Map<string, Promise<any>>;
  
  constructor() {
    this.pending = new Map();
  }
  
  /**
   * Execute a request, reusing pending request if key matches
   */
  async execute<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // If request is already pending, return existing promise
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }
    
    // Create new request
    const promise = requestFn()
      .finally(() => {
        // Remove from pending when complete
        this.pending.delete(key);
      });
    
    this.pending.set(key, promise);
    return promise;
  }
  
  /**
   * Cancel a pending request
   */
  cancel(key: string): void {
    this.pending.delete(key);
  }
  
  /**
   * Cancel all pending requests
   */
  cancelAll(): void {
    this.pending.clear();
  }
  
  /**
   * Check if a request is pending
   */
  isPending(key: string): boolean {
    return this.pending.has(key);
  }
}

export const requestQueue = new RequestQueue();

/**
 * Debounced search function with request deduplication
 * Use for: search inputs that trigger API calls
 */
export function createDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T>,
  options?: {
    wait?: number;
    minLength?: number;
  }
) {
  const { wait = 300, minLength = 2 } = options || {};
  
  const debouncedFn = debounceAsync(async (query: string) => {
    if (query.length < minLength) {
      return [] as T;
    }
    
    // Use request queue to prevent duplicate searches
    return requestQueue.execute(`search:${query}`, () => searchFn(query));
  }, wait);
  
  return debouncedFn;
}

/**
 * Rate limiter - limits function calls to a maximum rate
 * Use for: API calls with rate limits
 */
export class RateLimiter {
  private queue: Array<() => void>;
  private processing: boolean;
  private maxCalls: number;
  private interval: number;
  private callCount: number;
  private resetTime: number;
  
  constructor(maxCalls: number, intervalMs: number) {
    this.queue = [];
    this.processing = false;
    this.maxCalls = maxCalls;
    this.interval = intervalMs;
    this.callCount = 0;
    this.resetTime = Date.now() + intervalMs;
  }
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.process();
    });
  }
  
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      
      // Reset counter if interval has passed
      if (now >= this.resetTime) {
        this.callCount = 0;
        this.resetTime = now + this.interval;
      }
      
      // Check if we can make more calls
      if (this.callCount < this.maxCalls) {
        const fn = this.queue.shift();
        if (fn) {
          this.callCount++;
          await fn();
        }
      } else {
        // Wait until reset time
        const waitTime = this.resetTime - now;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
    
    this.processing = false;
  }
}

/**
 * Debounce configuration presets
 */
export const DEBOUNCE_PRESETS = {
  SEARCH: 300, // 300ms for search inputs
  VALIDATION: 500, // 500ms for form validation
  AUTOSAVE: 1000, // 1s for autosave
  RESIZE: 150, // 150ms for window resize
  SCROLL: 100, // 100ms for scroll events
  TYPING: 300, // 300ms for typing indicators
} as const;

/**
 * Throttle configuration presets
 */
export const THROTTLE_PRESETS = {
  SCROLL: 100, // 100ms for scroll events
  MOUSE_MOVE: 50, // 50ms for mouse move
  API_CALL: 1000, // 1s for API calls
  ANIMATION: 16, // ~60fps for animations
} as const;

/**
 * Example usage:
 * 
 * // Debounced search
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching for:', query);
 * }, DEBOUNCE_PRESETS.SEARCH);
 * 
 * // In component
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * 
 * // Async debounced search
 * const searchUsers = createDebouncedSearch(
 *   async (query: string) => {
 *     const response = await fetch(`/api/users?q=${query}`);
 *     return response.json();
 *   },
 *   { wait: 300, minLength: 2 }
 * );
 * 
 * // Throttled scroll handler
 * const handleScroll = throttle(() => {
 *   console.log('Scrolled');
 * }, THROTTLE_PRESETS.SCROLL);
 * 
 * window.addEventListener('scroll', handleScroll);
 * 
 * // Rate limited API calls
 * const rateLimiter = new RateLimiter(10, 1000); // 10 calls per second
 * 
 * async function makeApiCall() {
 *   return rateLimiter.execute(() => fetch('/api/data'));
 * }
 */
