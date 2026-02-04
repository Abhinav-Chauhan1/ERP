/**
 * Session caching utility to prevent N+1 session queries
 * Caches session data for 30 seconds to reduce database load
 */

interface CachedSession {
  data: any;
  timestamp: number;
}

const sessionCache = new Map<string, CachedSession>();
const CACHE_TTL = 30 * 1000; // 30 seconds

export function getCachedSession(sessionId: string): any | null {
  const cached = sessionCache.get(sessionId);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    sessionCache.delete(sessionId);
    return null;
  }
  
  return cached.data;
}

export function setCachedSession(sessionId: string, data: any): void {
  sessionCache.set(sessionId, {
    data,
    timestamp: Date.now(),
  });
}

export function clearCachedSession(sessionId: string): void {
  sessionCache.delete(sessionId);
}

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, cached] of sessionCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      sessionCache.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);